# Cold Storage Monitoring System — Backend API

Production-ready IoT cold storage monitoring backend built with Node.js, Express, MongoDB, Socket.IO, and PM2.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env

# 3. Seed the database (creates roles, sample devices, vegetables, and users)
npm run seed

# 4. Start development server
npm run dev

# 5. Open API docs
# http://localhost:5000/api-docs
```

---

## Project Structure

```
cold-storage-backend/
├── src/
│   ├── config/          # database, logger, morgan, cronJobs
│   ├── models/          # Mongoose schemas (User, Device, Vegetable, Alert, SensorReading, …)
│   ├── repositories/    # Data access layer (BaseRepository + per-model)
│   ├── services/        # Business logic (Auth, User, Device, Sensor, Alert, Dashboard)
│   ├── controllers/     # HTTP request handlers
│   ├── routes/          # Express routers
│   ├── middleware/       # auth, rbac, validate, deviceAccess, rateLimiter, errorHandler
│   ├── validators/      # Joi schemas
│   ├── utils/           # ApiResponse, ApiError, pagination, tokenHelper, constants
│   └── socket/          # Socket.IO setup and events
├── scripts/seed.js      # Database seeder
├── docs/swagger.js      # OpenAPI 3.0 spec
├── postman/             # Postman collection + environment
├── ecosystem.config.js  # PM2 config
├── nginx.conf           # Nginx reverse proxy config
└── .env.example
```

---

## API Base URL

```
http://localhost:5000/api/v1
```

All endpoints require `Authorization: Bearer <access_token>` except:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `GET  /health`

---

## Role-Based Access Control (RBAC)

| Role        | Users | Devices | Vegetables | Sensors        | Alerts          | Dashboard |
|-------------|-------|---------|------------|----------------|-----------------|-----------|
| Super Admin | CRUD  | CRUD    | CRUD       | Create + Read  | Read/Ack/Delete | Read      |
| Admin       | CRUD  | CRUD    | CRUD       | Create + Read  | Read/Ack        | Read      |
| Operator    | Read  | Read*   | Read       | Create + Read* | Read/Ack*       | Read*     |
| Viewer      | —     | Read*   | Read       | Read*          | Read*           | Read*     |

`*` = **Restricted to assigned devices only.**

### How device-scoped access works

When an **Operator** or **Viewer** logs in, every request that touches devices, sensor data, alerts, or dashboard stats is automatically filtered to only the devices assigned to their account.

- `GET /devices` → only returns their assigned devices
- `GET /sensors/:deviceId/latest` → 403 if device not in their list
- `GET /alerts` → only alerts for their devices
- `GET /dashboard/summary` → counts/stats for their devices only

Assign devices to a user via:
```
POST /api/v1/users/:userId/devices
{ "deviceIds": ["<mongoId1>", "<mongoId2>"] }
```

---

## Sensor Data Ingestion

IoT devices POST readings to:
```
POST /api/v1/sensors
Authorization: Bearer <operator_token>
Content-Type: application/json

{
  "deviceId": "CS001",
  "temperature": 5.4,
  "humidity": 82,
  "doorStatus": "closed",
  "timestamp": "2026-06-03T10:00:00Z"
}
```

The system will:
1. Persist the reading
2. Update `device.lastSeen` and set status `online`
3. Check temperature/humidity against the assigned vegetable's limits
4. Auto-generate alerts if thresholds are exceeded
5. Emit real-time events via Socket.IO to connected dashboard clients

---

## Real-Time (Socket.IO)

Connect with your access token:
```js
const socket = io('http://localhost:5000', {
  auth: { token: '<access_token>' }
});

// Subscribe to a device room
socket.emit('join:device', 'CS001');

// Events you receive
socket.on('sensor:reading',      (data) => { /* live temperature/humidity */ });
socket.on('device:status',       (data) => { /* online/offline change */ });
socket.on('alert:new',           (alert) => { /* new threshold breach */ });
socket.on('alert:acknowledged',  (alert) => { /* someone acked an alert */ });
socket.on('alert:resolved',      (alert) => { /* alert resolved */ });
socket.on('dashboard:update',    (data) => { /* any dashboard-level change */ });
```

All clients auto-join the `dashboard` room on connect.

---

## Alert Types

| Alert Type       | Trigger                                           | Severity |
|------------------|---------------------------------------------------|----------|
| temperature_high | Temp > vegetable max temperature                  | high     |
| temperature_low  | Temp < vegetable min temperature                  | medium   |
| humidity_high    | Humidity > vegetable max humidity                 | medium   |
| humidity_low     | Humidity < vegetable min humidity                 | low      |
| door_open        | Door open longer than `alertThresholds.doorOpenMinutes` | high |
| device_offline   | No data for `alertThresholds.offlineMinutes`      | critical |
| no_data          | Device online but no readings received            | high     |

---

## Seed Credentials

After running `npm run seed`:

| Role        | Email                          | Password       |
|-------------|-------------------------------|----------------|
| Super Admin | superadmin@coldstorage.com    | Admin@1234     |
| Admin       | admin@coldstorage.com         | Admin@1234     |
| Operator    | operator@coldstorage.com      | Operator@1234  |
| Viewer      | viewer@coldstorage.com        | Viewer@1234    |

---

## Production Deployment

### PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start in cluster mode (uses all CPU cores)
npm run pm2:start

# Monitor
pm2 monit

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart
```

### Nginx

```bash
# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/cold-storage-api
sudo ln -s /etc/nginx/sites-available/cold-storage-api /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.coldstorage.com
```

---

## MongoDB Indexes

Key indexes created automatically via Mongoose:

| Collection     | Index                                      | Purpose                        |
|----------------|--------------------------------------------|-------------------------------|
| users          | `email` (unique)                           | Login lookup                  |
| devices        | `deviceId` (unique), `status`, `isActive`  | Device lookup, status queries |
| sensorreadings | `{ device, timestamp: -1 }`                | Time-series reads             |
| sensorreadings | `timestamp` TTL (90 days)                  | Auto-expire old readings      |
| alerts         | `{ device, status }`, `{ status, createdAt }` | Active alert queries       |
| refreshtokens  | `expiresAt` TTL                            | Auto-expire tokens            |
| auditlogs      | `createdAt` TTL (1 year)                   | Auto-expire audit history     |

---

## Environment Variables

| Variable                  | Description                                 | Default         |
|---------------------------|---------------------------------------------|-----------------|
| `NODE_ENV`                | `development` / `production`               | development     |
| `PORT`                    | HTTP server port                            | 5000            |
| `MONGODB_URI`             | MongoDB connection string                   | —               |
| `JWT_SECRET`              | Access token signing secret (min 32 chars)  | —               |
| `JWT_EXPIRES_IN`          | Access token TTL                            | 15m             |
| `JWT_REFRESH_SECRET`      | Refresh token signing secret               | —               |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token TTL                           | 7d              |
| `DOOR_OPEN_ALERT_MINUTES` | Minutes before door-open alert fires        | 5               |
| `DEVICE_OFFLINE_MINUTES`  | Minutes before device-offline alert fires   | 10              |
| `ALLOWED_ORIGINS`         | Comma-separated CORS origins                | —               |
| `LOG_LEVEL`               | Winston log level                           | info            |
