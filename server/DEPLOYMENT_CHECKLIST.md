# Cold Storage Monitoring System - Deployment Checklist

## ✅ Project Completion Status

This is a **production-ready IoT Cold Storage Monitoring System** fully implemented with all 30+ requirements completed.

---

## 📋 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **MongoDB**: v5.0+ running on `localhost:27017` (or update MONGODB_URI in .env)
- **npm**: v9+

### 2. Installation
```bash
cd d:/SEPL/COLD_STORAGE
npm install
```

### 3. Database Seeding (First Time Only)
```bash
npm run seed
```

This creates:
- **4 Roles**: Super Admin, Admin, Operator, Viewer
- **6 Vegetables**: Potato, Tomato, Apple, Banana, Orange, Carrot
- **5 Devices**: CS001-CS005 with realistic temperature/humidity ranges
- **4 Test Users**:
  - Super Admin: `superadmin@coldstorage.com` / `Admin@1234`
  - Admin: `admin@coldstorage.com` / `Admin@1234`
  - Operator: `operator@coldstorage.com` / `Operator@1234` (assigned to CS001, CS002)
  - Viewer: `viewer@coldstorage.com` / `Viewer@1234` (assigned to CS003)

### 4. Start Development Server
```bash
npm run dev
```

Server starts at:
- **API Base**: http://localhost:5000/api/v1
- **API Docs**: http://localhost:5000/api-docs
- **Health**: http://localhost:5000/health
- **WebSocket**: ws://localhost:5000 (Socket.IO)

---

## 🏗️ Architecture Overview

```
src/
├── config/              # Database, logging, Morgan, cron jobs
├── models/              # Mongoose schemas (User, Device, Vegetable, Alert, etc.)
├── repositories/        # Data access layer (BaseRepository + specialized repos)
├── services/            # Business logic (Auth, User, Device, Sensor, Alert, Dashboard)
├── controllers/         # HTTP request handlers
├── routes/              # Express route definitions
├── middleware/          # Auth, RBAC, device access, validation, rate limiting, error handling
├── validators/          # Joi validation schemas
├── utils/               # ApiResponse, ApiError, pagination, token helpers, constants
└── socket/              # Socket.IO setup and real-time event handling
```

---

## 🔐 Role-Based Access Control (RBAC)

| Role        | Users | Devices | Vegetables | Sensors       | Alerts          | Dashboard |
|-------------|-------|---------|------------|---------------|-----------------|-----------|
| Super Admin | CRUD  | CRUD    | CRUD       | Create + Read | Read/Ack/Delete | Read      |
| Admin       | CRUD  | CRUD    | CRUD       | Create + Read | Read/Ack        | Read      |
| Operator    | Read  | Read*   | Read       | Create + Read*| Read/Ack*       | Read*     |
| Viewer      | —     | Read*   | Read       | Read*         | Read*           | Read*     |

`*` = Restricted to assigned devices only

---

## 📡 Core Features

### Authentication
- JWT with access token (15m) + refresh token (7d)
- Token rotation on refresh with revocation
- Logout all devices capability
- Password change detection

### Device Management
- Temperature/humidity monitoring
- Real-time door status tracking
- Last seen timestamp with online/offline status
- Vegetable assignment per device

### Sensor Data Ingestion
- Temperature range: -50°C to 100°C
- Humidity range: 0-100%
- Door status enum: open/closed
- Automatic alert generation based on vegetable thresholds
- Real-time WebSocket emission

### Alert System
- 7 alert types: temperature_high/low, humidity_high/low, door_open, device_offline, no_data
- 4 severity levels: critical, high, medium, low
- Acknowledge and resolve workflow
- Prevent duplicate active alerts

### Dashboard
- Summary statistics with counts
- Device health metrics (online/offline, last seen)
- Temperature overview (24h/48h averages)
- Alerts by device
- Role-based data filtering

### Real-Time Updates (Socket.IO)
- Device room subscriptions: `join:device<deviceId>`
- Auto-join dashboard room on connect
- Events: sensor:reading, device:status, alert:new, alert:acknowledged, alert:resolved, dashboard:update

---

## 📊 Database Schema

### Collections & Indexes

| Collection      | Key Indexes                                    | Purpose                  |
|-----------------|------------------------------------------------|--------------------------|
| users           | email (unique), role, isActive                 | Authentication, RBAC     |
| devices         | deviceId (unique), status, isActive            | Device lookup            |
| vegetables      | name (unique), temperature.min/max             | Threshold matching       |
| sensorreadings  | { device, timestamp: -1 }, timestamp (TTL 90d)| Time-series queries      |
| alerts          | { device, status }, { status, createdAt }      | Active alert queries     |
| refreshtokens   | expiresAt (TTL), revoked                       | Token lifecycle          |
| auditlogs       | createdAt (TTL 1 year), userId, resourceType  | Compliance tracking      |

---

## 🧪 Testing with Postman

### Import Files
1. **Collection**: `postman/ColdStorage.postman_collection.json` (80+ requests)
2. **Environment**: `postman/ColdStorage.postman_environment.json`

### Request Organization (8 Folders)

1. **Health & Server** (2 requests)
   - Health check
   - Swagger UI verification

2. **Authentication** (11 requests)
   - Login for all 4 roles
   - Refresh token with rotation
   - Logout / Logout all
   - Get current user
   - Error cases (wrong password, invalid email, invalid token)

3. **Vegetables** (8 requests)
   - Full CRUD
   - Search and filtering
   - Duplicate prevention
   - Temperature/humidity validation

4. **Devices** (11 requests)
   - Full CRUD
   - Status filtering
   - Vegetable assignment/removal
   - Error cases

5. **Users** (13 requests)
   - Full CRUD with role management
   - Device assignment/removal
   - Activation/deactivation
   - Error cases

6. **Sensor Readings** (13 requests)
   - Ingest with alert generation
   - Temperature thresholds (high, low, within range)
   - Humidity thresholds
   - Door status tracking
   - Latest reading retrieval
   - Historical data with pagination
   - Stats calculation

7. **Alerts** (9 requests)
   - List with filters (status, severity, alertType, dateRange)
   - Get by ID
   - Acknowledge
   - Resolve
   - Delete with authorization

8. **Dashboard** (6 requests)
   - Summary statistics
   - Device health metrics
   - Temperature overview (24h, 48h)
   - Alerts by device
   - My assigned devices (role-aware)

9. **RBAC & Access Control** (17 requests)
   - Device access restrictions for Operator/Viewer
   - Role-based permission enforcement
   - Device filtering in list endpoints
   - 403 unauthorized scenarios

### Running Tests
1. Set `baseUrl` to `http://localhost:5000/api/v1` in environment
2. Execute "Login As Super Admin" first to populate tokens
3. Assign devices to test users as needed
4. Run remaining requests sequentially for proper token chaining

---

## 🚀 Production Deployment

### PM2 Cluster Mode
```bash
npm run pm2:start      # Start in cluster mode (all CPU cores)
npm run pm2:logs       # View logs
npm run pm2:restart    # Graceful restart
npm run pm2:stop       # Graceful stop
```

Configuration: `ecosystem.config.js`
- Cluster mode with auto-scaling
- Max memory restart at 500MB
- 10-second graceful shutdown timeout
- Automatic restart on crash

### Nginx Reverse Proxy
```bash
sudo cp nginx.conf /etc/nginx/sites-available/cold-storage-api
sudo ln -s /etc/nginx/sites-available/cold-storage-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Features:
- SSL/TLS termination with Let's Encrypt
- Rate limiting (10 req/sec per IP)
- WebSocket upgrade for Socket.IO
- Security headers (HSTS, X-Frame-Options, etc.)
- Request logging and body size limits

### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.coldstorage.com
```

---

## 📝 Environment Variables

| Variable                | Description                      | Default              |
|-------------------------|----------------------------------|----------------------|
| NODE_ENV                | development / production         | development          |
| PORT                    | HTTP server port                 | 5000                 |
| MONGODB_URI             | MongoDB connection string        | —                    |
| JWT_SECRET              | Access token signing secret      | —                    |
| JWT_EXPIRES_IN          | Access token TTL                 | 15m                  |
| JWT_REFRESH_SECRET      | Refresh token signing secret     | —                    |
| JWT_REFRESH_EXPIRES_IN  | Refresh token TTL                | 7d                   |
| DOOR_OPEN_ALERT_MINUTES | Minutes before door-open alert   | 5                    |
| DEVICE_OFFLINE_MINUTES  | Minutes before offline alert     | 10                   |
| LOG_LEVEL               | Winston log level                | info                 |
| ALLOWED_ORIGINS         | Comma-separated CORS origins     | —                    |

---

## 🔄 Cron Jobs

The system runs automated tasks:

1. **Device Offline Detection** (Every 1 minute)
   - Checks devices with `lastSeen` > DEVICE_OFFLINE_MINUTES
   - Creates device_offline alert (critical severity)
   - Sets device status to offline

2. **No-Data Alert** (Every 5 minutes)
   - Detects online devices with no readings
   - Creates no_data alert (high severity)

---

## 📚 API Endpoint Summary

### Authentication
```
POST   /auth/login                     Login
POST   /auth/refresh-token             Refresh access token
POST   /auth/logout                    Logout current session
POST   /auth/logout-all                Logout all devices
GET    /auth/me                        Get current user
```

### Users
```
GET    /users                          List users (paginated)
POST   /users                          Create user
GET    /users/:id                      Get user details
PATCH  /users/:id                      Update user
DELETE /users/:id                      Delete user
POST   /users/:userId/devices          Assign devices
DELETE /users/:userId/devices/:deviceId Remove device assignment
PATCH  /users/:id/activate             Activate user
PATCH  /users/:id/deactivate           Deactivate user
```

### Devices
```
GET    /devices                        List devices (paginated)
POST   /devices                        Create device
GET    /devices/:id                    Get device details
PATCH  /devices/:id                    Update device
DELETE /devices/:id                    Delete device
POST   /devices/:deviceId/vegetables   Assign vegetable
DELETE /devices/:deviceId/vegetables   Remove vegetable
```

### Vegetables
```
GET    /vegetables                     List vegetables (paginated)
POST   /vegetables                     Create vegetable
GET    /vegetables/:id                 Get vegetable details
PATCH  /vegetables/:id                 Update vegetable
DELETE /vegetables/:id                 Delete vegetable
```

### Sensor Readings
```
POST   /sensors                        Ingest sensor reading
GET    /sensors/:deviceId/latest       Get latest reading
GET    /sensors/:deviceId/history      Get historical data (paginated)
GET    /sensors/:deviceId/stats        Get temperature stats
```

### Alerts
```
GET    /alerts                         List alerts (paginated, filterable)
GET    /alerts/:id                     Get alert details
PATCH  /alerts/:id/acknowledge         Acknowledge alert
PATCH  /alerts/:id/resolve             Resolve alert
DELETE /alerts/:id                     Delete alert
```

### Dashboard
```
GET    /dashboard/summary              Summary statistics
GET    /dashboard/device-health        Device health metrics
GET    /dashboard/temperature-overview Temperature overview
GET    /dashboard/alerts-by-device     Alerts grouped by device
GET    /dashboard/my-devices           User's assigned devices
```

### Health & Docs
```
GET    /health                         Server health check
GET    /api-docs                       Swagger UI
GET    /api-docs.json                  OpenAPI 3.0 spec
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Verify MONGODB_URI in .env matches your setup
- Check connection pooling limits

### Port Already in Use
- Change PORT in .env
- Or kill existing process: `lsof -i :5000` → `kill -9 <PID>`

### Seed Script Fails
- Ensure MongoDB is running and accessible
- Clear existing data: `mongo cold_storage_db --eval "db.dropDatabase()"`
- Retry: `npm run seed`

### JWT Errors
- Verify JWT_SECRET and JWT_REFRESH_SECRET are set (min 32 chars)
- Check token expiry times in .env
- Clear browser cookies/localStorage if testing locally

### Socket.IO Connection Issues
- Ensure CORS is properly configured for your frontend origin
- Check ALLOWED_ORIGINS in .env
- Verify WebSocket is not blocked by firewall/proxy

---

## 📦 Dependencies Summary

| Package              | Purpose                          | Version |
|----------------------|----------------------------------|---------|
| express              | Web framework                    | ^4.19.2 |
| mongoose             | MongoDB ODM                      | ^8.4.3  |
| jsonwebtoken         | JWT authentication               | ^9.0.2  |
| bcryptjs             | Password hashing                 | ^2.4.3  |
| socket.io            | Real-time WebSocket              | ^4.7.5  |
| morgan               | HTTP request logging             | ^1.10.0 |
| winston              | Application logging              | ^3.13.0 |
| joi                  | Schema validation                | ^17.13.1|
| express-rate-limit   | Rate limiting                    | ^7.3.1  |
| helmet               | Security headers                 | ^7.1.0  |
| cors                 | CORS handling                    | ^2.8.5  |
| node-cron            | Cron job scheduling              | ^3.0.3  |
| nodemon (dev)        | Auto-restart on file changes     | ^3.1.4  |

---

## ✨ Key Implementation Highlights

1. **Clean Architecture**: Separation of concerns with Repository → Service → Controller pattern
2. **Scalable RBAC**: Permission matrix-based access control with middleware enforcement
3. **Device Scoping**: Automatic data filtering for Operator/Viewer users at query level
4. **Real-Time Updates**: Socket.IO with room-based broadcasting
5. **Error Handling**: Standardized API response format with custom error classes
6. **Data Validation**: Joi schemas with comprehensive validation rules
7. **Security**: Helmet, CORS, rate limiting, input sanitization, JWT with token rotation
8. **Audit Logging**: Complete request/response audit trail for compliance
9. **Automatic Cleanup**: TTL indexes for sensor readings (90d), refresh tokens, audit logs (1yr)
10. **Production Ready**: PM2 clustering, Nginx reverse proxy, graceful shutdown, comprehensive logging

---

## 🎯 Next Steps (Optional Enhancements)

1. **Frontend Dashboard**: Build React/Vue dashboard consuming these APIs
2. **Mobile App**: Mobile app with real-time sensor visualizations
3. **Analytics**: Historical trend analysis and predictive alerts
4. **Multi-Tenancy**: Support multiple organizations
5. **Advanced Reporting**: PDF/Excel export of alerts and readings
6. **Email Notifications**: Alert email notifications with SMTP integration
7. **Database Replication**: MongoDB replica set for high availability
8. **Kubernetes Deployment**: Dockerize and deploy to K8s cluster

---

## 📞 Support

- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health
- **Logs**: `./logs/` directory (daily rotation)
- **Source Code**: Well-commented, follow DDD principles

---

**Status**: ✅ Complete and Ready for Deployment  
**Last Updated**: June 3, 2026  
**Environment**: Development & Production Ready
