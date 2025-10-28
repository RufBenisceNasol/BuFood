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
const supabaseAuthRoutes = require('./routes/supabaseAuthRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeMemberRoutes = require('./routes/storeMemberRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favorites');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const http = require('http');
const { setupSocket } = require('./utils/socket');
// Trust the reverse proxy (e.g., Render, Nginx) so req.ip reflects the real client IP
// and express-rate-limit can safely use X-Forwarded-For
app.set('trust proxy', 1);
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
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req, _res) => req.ip, // Will respect trust proxy
});

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500
});

// Middleware
app.use(compression()); // Compress responses

// Allow CORS from specific origins (deployed), and broadly allow localhost/127.0.0.1 (any port) for dev
const allowedOrigins = new Set([
    'https://capstonedelibup-o7sl.onrender.com', // Backend
    'https://dellibup.onrender.com',             // Frontend (Render)
    'https://capstonedelibup.vercel.app',        // Frontend (Vercel)
]);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        try {
            const u = new URL(origin);
            const host = u.hostname;
            if (allowedOrigins.has(origin)) return callback(null, true);
            // Allow localhost and 127.0.0.1 on any port for development
            if (host === 'localhost' || host === '127.0.0.1') return callback(null, true);
            // Allow Capacitor/WebView
            if (origin === 'capacitor://localhost') return callback(null, true);
        } catch (_) {}
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));

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

// Root route handler
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the BuFood API backend!',
        status: 'ok'
    });
});

// Routes with caching where appropriate
app.use('/api/auth', authRoutes); // Legacy JWT authentication
app.use('/api/auth/supabase', supabaseAuthRoutes); // New Supabase authentication
// IMPORTANT: Do not apply cache globally to /api/products, since POST/PATCH use multipart/form-data
app.use('/api/products', productRoutes);
// Do NOT apply cache middleware globally to /api/store to avoid interfering with multipart/form-data on PUT/POST
app.use('/api/store', storeRoutes);
app.use('/api/store', storeMemberRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/cart', cartRoutes);
// Alias to support plural path from clients
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// JSON 404 fallback for API routes
app.use('/api', (req, res, next) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

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

// Start server with Socket.IO
const server = http.createServer(app);
setupSocket(server, { /* socket options can go here */ });
server.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 Server + Socket started on port ${port}`);
    logger.info(`📚 API Documentation available at http://[YOUR_IP]:${port}/api-docs`);
});
