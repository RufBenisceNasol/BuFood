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
                url: '{protocol}://{hostname}:{port}',
                description: 'Dynamic server',
                variables: {
                    protocol: {
                        enum: ['http', 'https'],
                        default: 'http'
                    },
                    hostname: {
                        default: 'localhost'
                    },
                    port: {
                        default: '8000'
                    }
                }
            }
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