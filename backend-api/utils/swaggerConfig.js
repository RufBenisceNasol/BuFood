const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BuFood API Documentation',
            version: '1.0.0',
            description: 'API documentation for BuFood application',
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:8000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: [
        './routes/*.js',
        './models/*.js',
    ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;