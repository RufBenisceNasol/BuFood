const mongoose = require('mongoose');

const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      health.database = 'connected';
    } else {
      health.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check email configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      health.email = 'configured';
    } else {
      health.email = 'not_configured';
    }

    // Check required environment variables
    const requiredEnvs = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'BASE_URL'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      health.environment_variables = `missing: ${missingEnvs.join(', ')}`;
      health.status = 'unhealthy';
    } else {
      health.environment_variables = 'configured';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

module.exports = { healthCheck };
