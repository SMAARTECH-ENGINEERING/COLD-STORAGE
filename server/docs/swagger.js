const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cold Storage Monitoring System API',
      version: '1.0.0',
      description: `
## IoT Cold Storage Monitoring System

A production-ready backend API for monitoring vegetable cold storage facilities using IoT sensors.

### Key Features
- **Real-time monitoring** via Socket.IO
- **Role-based access control** (Super Admin, Admin, Operator, Viewer)
- **Alert management** for temperature, humidity, door status, and device offline events
- **Historical sensor data** with pagination and filtering
- **Dashboard analytics** for device health and statistics

### Authentication
All protected endpoints require a **Bearer JWT token** in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Socket.IO Events
Connect to the WebSocket server with your access token:
\`\`\`javascript
const socket = io('http://localhost:5000', {
  auth: { token: '<access_token>' }
});

// Subscribe to a specific device
socket.emit('join:device', '<deviceId>');

// Listen for sensor readings
socket.on('sensor:reading', (data) => console.log(data));

// Listen for new alerts
socket.on('alert:new', (alert) => console.log(alert));

// Listen for device status changes
socket.on('device:status', (status) => console.log(status));
\`\`\`
      `,
      contact: {
        name: 'SEPL Engineering',
        email: 'info@smaatechengineering.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Development server' },
      { url: 'https://api.coldstorage.com/api/v1', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email' },
            role: { $ref: '#/components/schemas/Role' },
            isActive: { type: 'boolean' },
            phone: { type: 'string' },
            assignedDevices: { type: 'array', items: { $ref: '#/components/schemas/Device' } },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', enum: ['super_admin', 'admin', 'operator', 'viewer'] },
            displayName: { type: 'string' },
          },
        },
        Device: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            deviceId: { type: 'string', example: 'CS001' },
            name: { type: 'string', example: 'Storage Unit A' },
            location: { type: 'string', example: 'Warehouse Block 1' },
            status: { type: 'string', enum: ['online', 'offline', 'maintenance'] },
            lastSeen: { type: 'string', format: 'date-time' },
            assignedVegetable: { $ref: '#/components/schemas/Vegetable' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Vegetable: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Potato' },
            description: { type: 'string' },
            temperature: {
              type: 'object',
              properties: { min: { type: 'number' }, max: { type: 'number' } },
            },
            humidity: {
              type: 'object',
              properties: { min: { type: 'number' }, max: { type: 'number' } },
            },
            storageDurationDays: { type: 'integer', example: 90 },
            isActive: { type: 'boolean' },
          },
        },
        SensorReading: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            deviceId: { type: 'string', example: 'CS001' },
            temperature: { type: 'number', example: 5.4 },
            humidity: { type: 'number', example: 82 },
            doorStatus: { type: 'string', enum: ['open', 'closed'] },
            timestamp: { type: 'string', format: 'date-time' },
            isAlert: { type: 'boolean' },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            device: { $ref: '#/components/schemas/Device' },
            deviceId: { type: 'string' },
            alertType: {
              type: 'string',
              enum: ['temperature_high', 'temperature_low', 'humidity_high', 'humidity_low', 'door_open', 'device_offline', 'no_data'],
            },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            message: { type: 'string' },
            value: { type: 'number' },
            threshold: { type: 'number' },
            status: { type: 'string', enum: ['active', 'acknowledged', 'resolved'] },
            acknowledgedBy: { $ref: '#/components/schemas/User' },
            acknowledgedAt: { type: 'string', format: 'date-time' },
            resolvedBy: { $ref: '#/components/schemas/User' },
            resolvedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
