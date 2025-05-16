require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./utils/swaggerConfig');
const { redisClient, cache } = require('./utils/cacheConfig');
const { logger, requestLogger, errorLogger } = require('./utils/logger');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { authenticate } = require('./middlewares/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const port = process.env.PORT || 8000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https:", "http:"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' }
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500
});

// Middleware
app.use(compression()); // Compress responses
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger); // Add request logging

// Add request ID to each request
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    next();
});

// Apply rate limiting
app.use('/api', limiter);
app.use('/api', speedLimiter);

// Initialize Redis connection if enabled
if (process.env.USE_REDIS === 'true' && redisClient) {
    (async () => {
        try {
            await redisClient.connect();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error('Redis connection error:', error);
            logger.info('Continuing with in-memory cache');
        }
    })();
} else {
    logger.info('Running with in-memory cache (Redis disabled)');
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('✅ Successfully connected to MongoDB'))
    .catch(err => {
        logger.error('❌ Error connecting to MongoDB:', err);
        process.exit(1);
    });

// After MongoDB connection is established
mongoose.connection.once('open', async () => {
    logger.info('MongoDB connection established successfully');
    
    // Initialize cart collection
    try {
        const Cart = mongoose.model('Cart');
        await Cart.collection.dropIndexes();
        logger.info('Successfully dropped all indexes from cart collection');
    } catch (err) {
        logger.error('Error dropping indexes:', err);
    }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes with caching where appropriate
app.use('/api/auth', authRoutes);
app.use('/api/products', cache('10 minutes'), productRoutes);
app.use('/api/store', cache('15 minutes'), storeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error(`[Error] [${req.id}] ${err.stack}`);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message,
            requestId: req.id
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Authentication Error',
            details: err.message,
            requestId: req.id
        });
    }

    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        requestId: req.id
    });
});

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, starting graceful shutdown...');
    try {
        if (process.env.USE_REDIS === 'true' && redisClient) {
            await redisClient.quit();
            logger.info('Redis connection closed');
        }
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server started on port ${port}`);
    logger.info(`📚 API Documentation available at http://[YOUR_IP]:${port}/api-docs`);
});
