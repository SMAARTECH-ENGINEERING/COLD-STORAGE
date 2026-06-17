# Cold Storage Monitor — IoT Monitoring System

A production-ready, full-stack IoT solution for real-time monitoring of cold storage facilities. Tracks temperature, humidity, door status, VOC levels, and compressor state across multiple ESP32-based sensor devices, with a React web dashboard, React Native mobile app, and Socket.IO real-time updates.

**Author:** SEPL Engineering  
**Version:** 1.0.0  
**License:** MIT

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Authentication & RBAC](#authentication--rbac)
- [Real-Time Events](#real-time-events)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Known Issues & Improvements](#known-issues--improvements)
- [Future Scope](#future-scope)

---

## Overview

### Real-World Use Case

Agricultural cold storage facilities (vegetables, fruits) require precise temperature and humidity control to prevent spoilage. This system provides:

- **Operators** a real-time view of all storage units and sensor readings
- **Admins** full control over devices, users, and storage configurations
- **Automatic alerts** when thresholds are breached or devices go offline
- **Mobile access** for field operators via the React Native app

### How It Works

```
ESP32 Device
    │
    │  POST /api/v1/sensors  (HTTP, no auth)
    ▼
Express Backend
    │── Stores reading in MongoDB
    │── Checks thresholds against vegetable profile
    │── Creates alerts if thresholds breached
    │── Emits Socket.IO events to connected clients
    ▼
React Dashboard / React Native App
    │── Displays live sensor readings
    │── Shows alerts and device status
    └── Allows acknowledge/resolve alerts
```

---

## Features

### Core Monitoring
- Real-time sensor data ingestion from ESP32 devices (temperature, humidity, door status, VOC, compressor)
- 90-day time-series data retention with MongoDB TTL indexes
- Paginated historical sensor readings with time range filtering
- Per-device statistics: min, max, average for configurable time windows

### Alert System
- Automatic threshold-based alerts: `temperature_high`, `temperature_low`, `humidity_high`, `humidity_low`, `door_open`
- Background cron jobs: `device_offline` (every 1 minute), `no_data` (every 5 minutes)
- Severity levels: `low`, `medium`, `high`, `critical`
- Alert lifecycle: `active` → `acknowledged` → `resolved` with user attribution
- Real-time alert push via Socket.IO

### Device Management
- Full CRUD for IoT devices with unique alphanumeric device IDs
- Device status tracking: `online`, `offline`, `maintenance`
- Per-device configurable thresholds (door open minutes, offline minutes)
- Vegetable profile assignment for threshold-aware monitoring

### Storage Unit Management
- Cold storage unit configuration with capacity (tons)
- Current stock tracking with real-time capacity calculations
- Vegetable-specific packing density simulation (`potato: 650 kg/m³`, `onion: 550 kg/m³`, etc.)
- Multi-device assignment per storage unit

### Vegetable Profiles
- Per-vegetable temperature and humidity safe ranges
- Storage duration tracking (days)
- Used as thresholds for automatic alert generation

### User Management & RBAC
- 4-tier role system: `super_admin`, `admin`, `operator`, `viewer`
- Resource-action permission matrix (see [RBAC section](#authentication--rbac))
- Operators see only their assigned devices; admins see all
- Bulk device assignment and removal per user

### Authentication
- JWT-based with access tokens (15 min) + refresh tokens (7 days)
- Token rotation on refresh
- Multi-session logout (`logout-all`)
- Password change invalidates prior tokens

### Dashboard & Analytics
- Device health overview: temp/humidity ranges per device
- Temperature trend charts (configurable hours lookback)
- Active alerts grouped by device
- Global summary: device counts, alert summary, recent readings

### Web Dashboard (React)
- MUI v5 component library with Tailwind CSS utility classes
- Recharts for time-series visualization
- React Data Table Component for paginated data tables
- Socket.IO real-time updates (no manual refresh needed)
- Axios interceptors for transparent token refresh
- Error boundary with graceful fallback UI

### Mobile App (React Native / Expo)
- Stack + Tab navigation
- Push notifications via Expo Notifications
- Secure token storage via `expo-secure-store`
- Chart visualization via `react-native-chart-kit`
- Offline-aware design

### Operations
- Swagger UI at `/api-docs` (OpenAPI 3.0)
- Winston structured logging with daily log rotation
- Morgan HTTP request logging
- PM2 cluster mode for production
- Audit log trail for all write operations (1-year TTL)
- Rate limiting: 100 req/15 min (API), 10 req/15 min (auth), 1000 req/min (sensor)

---

## Architecture

```
d:\SEPL\COLD_STORAGE(PROD)
├── server/          Node.js + Express REST API + Socket.IO
├── client/          React web dashboard (CRA + MUI + Recharts)
├── MobileApp/       React Native mobile app (Expo)
└── esp32/           ESP32 firmware reference code
```

### Backend Layer Architecture

```
server/src/
├── routes/          Route definitions (URL → Controller)
├── controllers/     HTTP layer — parse request, delegate to service, send response
├── services/        Business logic — orchestrate repositories, emit events
├── repositories/    Data access — Mongoose queries, no business logic
├── models/          Mongoose schemas with indexes and virtuals
├── middleware/       auth, rbac, deviceAccess, validate, rateLimiter, errorHandler
├── validators/      Joi schemas per resource
├── socket/          Socket.IO manager and event constants
├── config/          DB connection, cron jobs, logger, morgan
└── utils/           ApiResponse, ApiError, asyncHandler, tokenHelper, pagination
```

### Request Flow

```
HTTP Request
    → rateLimiter
    → helmet / cors / compression
    → express.json
    → auth middleware (JWT verification, user attachment)
    → rbac middleware (permission check)
    → deviceAccess middleware (scope filtering)
    → validate middleware (Joi schema)
    → Controller
    → Service
    → Repository
    → MongoDB
    ← ApiResponse.success() / ApiError
    ← errorHandler (global catch)
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | ≥ 18.0.0 |
| **Backend Framework** | Express | 4.19.2 |
| **Database** | MongoDB + Mongoose | 8.4.3 |
| **Real-Time** | Socket.IO | 4.7.5 |
| **Auth** | JWT (jsonwebtoken) | 9.0.2 |
| **Password Hashing** | bcryptjs | 2.4.3 |
| **Validation** | Joi | 17.13.1 |
| **Scheduling** | node-cron | 3.0.3 |
| **Logging** | Winston + Morgan | 3.13.0 |
| **API Docs** | Swagger UI Express | 5.0.1 |
| **Security** | Helmet, express-mongo-sanitize, xss-clean | latest |
| **Rate Limiting** | express-rate-limit | 7.3.1 |
| **Process Manager** | PM2 | — |
| **Frontend Framework** | React | 18.2.0 |
| **UI Library** | MUI (Material-UI) | 5.14.16 |
| **Charts** | Recharts | 3.8.1 |
| **HTTP Client** | Axios | 1.7.9 |
| **Routing** | React Router v6 | 6.16.0 |
| **Tables** | React Data Table Component | 8.3.0 |
| **Notifications** | React Toastify | 9.1.3 |
| **Styling** | Tailwind CSS | 3.3.3 |
| **Mobile Framework** | React Native (Expo) | 0.81.5 / SDK 54 |
| **Mobile Navigation** | React Navigation v7 | 7.x |
| **Mobile Charts** | react-native-chart-kit | 6.12.0 |
| **Mobile Storage** | expo-secure-store | 15.0.7 |
| **Push Notifications** | expo-notifications | 0.32.12 |
| **IoT Device** | ESP32 (HTTP POST to `/api/v1/sensors`) | — |

---

## Project Structure

```
server/
├── server.js                  # HTTP server, Socket.IO init, graceful shutdown
├── app.js                     # Express app, middleware stack
├── ecosystem.config.js        # PM2 cluster config
├── scripts/
│   ├── seed.js                # DB initialization (roles, users, sample data)
│   └── updateRolePermissions.js
├── docs/swagger.js            # OpenAPI 3.0 spec
├── src/
│   ├── config/
│   │   ├── database.js        # Mongoose connection with retry logic
│   │   ├── cronJobs.js        # Offline device + no-data background checks
│   │   ├── logger.js          # Winston daily-rotate logger
│   │   └── morgan.js          # HTTP access log stream
│   ├── models/
│   │   ├── User.js            # Users with bcrypt pre-save hook
│   │   ├── Device.js          # IoT device registry
│   │   ├── SensorReading.js   # Time-series readings (90-day TTL)
│   │   ├── Alert.js           # Alert lifecycle tracking
│   │   ├── StorageUnit.js     # Storage unit with capacity virtuals
│   │   ├── Vegetable.js       # Vegetable storage profiles
│   │   ├── Role.js            # RBAC role + permission matrix
│   │   ├── RefreshToken.js    # Token revocation (TTL on expiresAt)
│   │   ├── AuditLog.js        # Write operation audit trail (1-year TTL)
│   │   └── DeviceAssignment.js
│   ├── repositories/
│   │   ├── BaseRepository.js  # findById, find, create, update, delete, count
│   │   ├── DeviceRepository.js
│   │   ├── SensorReadingRepository.js
│   │   ├── AlertRepository.js
│   │   ├── UserRepository.js
│   │   ├── StorageUnitRepository.js
│   │   ├── VegetableRepository.js
│   │   ├── RoleRepository.js
│   │   └── RefreshTokenRepository.js
│   ├── services/
│   │   ├── AuthService.js
│   │   ├── DeviceService.js
│   │   ├── SensorService.js   # Ingestion, threshold checks, alert creation
│   │   ├── AlertService.js
│   │   ├── UserService.js
│   │   ├── StorageUnitService.js
│   │   ├── VegetableService.js
│   │   └── DashboardService.js
│   ├── controllers/           # (One per domain, thin HTTP layer)
│   ├── routes/
│   │   └── index.js           # Aggregates all domain routes under /api/v1
│   ├── middleware/
│   │   ├── auth.js            # JWT verify + user attach
│   │   ├── rbac.js            # requirePermission / requireRole helpers
│   │   ├── deviceAccess.js    # Scope filter for operators/viewers
│   │   ├── errorHandler.js    # Global Express error handler
│   │   ├── validate.js        # Joi validation wrapper
│   │   ├── rateLimiter.js
│   │   └── auditLogger.js
│   ├── validators/            # Joi schemas: auth, device, sensor, user, storageUnit, vegetable
│   ├── socket/
│   │   ├── socketManager.js   # Socket.IO init + emit helpers
│   │   └── events.js          # SOCKET_EVENTS constants
│   └── utils/
│       ├── ApiResponse.js     # success(), paginated(), error()
│       ├── ApiError.js        # Custom error class with statusCode
│       ├── asyncHandler.js    # Express async error wrapper
│       ├── tokenHelper.js     # generateAccessToken, generateRefreshToken, verify
│       ├── pagination.js      # parsePagination, buildPaginationMeta
│       └── constants.js       # ROLES, PERMISSIONS, ROLE_PERMISSIONS, ALERT_SEVERITY_MAP

client/
├── src/
│   ├── api/                   # Per-domain API modules (axios calls)
│   │   └── axios.js           # Base instance + refresh token interceptor
│   ├── context/AuthContext.jsx # Global auth state + hasPermission()
│   ├── hooks/useSocket.js     # Socket.IO client hook
│   ├── Routes/
│   │   ├── AllRoutes.js
│   │   └── middleware/
│   │       ├── AuthLayout.jsx  # Redirects unauthenticated users to /
│   │       └── NonAuthLayout.jsx
│   ├── Screens/
│   │   ├── Auth/              # Login, SignUp
│   │   ├── Admin/             # Dashboard, Devices, Alerts, Vegetables,
│   │   │                      #   StorageUnits, Users, Profile, Settings, Reports
│   │   ├── Layout/            # Navbar, Sidebar, Footer, Layout wrapper
│   │   └── Common/            # Tostify wrapper
│   └── Components/            # ErrorBoundary, AdminProfileDropDown, LoginLeftSection

MobileApp/
├── App.js                     # Entry point, AuthContext, Navigation
└── src/
    ├── screens/               # Login, Dashboard, DeviceList, DeviceDetail,
    │                          #   AlertList, AlertDetail, SensorHistory,
    │                          #   Profile, ChangePassword, NotificationSettings
    ├── navigation/            # Stack + Tab navigators
    ├── services/              # auth, dashboard, devices, sensors, alerts,
    │                          #   notifications, socket
    ├── context/AuthContext.js
    ├── config/env.js          # Base URL configuration
    ├── data/                  # Mock/fallback data
    └── theme/styles.js        # Shared RN stylesheet
```

---

## Database Design

### Collections & Schemas

#### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | max 100 |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt, never returned in queries |
| `role` | ObjectId | ref: `roles` |
| `isActive` | Boolean | default: true |
| `phone` | String | optional |
| `assignedDevices` | [ObjectId] | ref: `devices` |
| `lastLogin` | Date | |
| `passwordChangedAt` | Date | token invalidation guard |
| `createdAt/updatedAt` | Date | timestamps |

#### `devices`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `deviceId` | String | unique, uppercase, 3–20 chars |
| `name` | String | max 100 |
| `location` | String | max 200 |
| `status` | enum | `online` / `offline` / `maintenance` |
| `lastSeen` | Date | updated on each sensor ingest |
| `assignedVegetable` | ObjectId | ref: `vegetables` |
| `isActive` | Boolean | |
| `createdBy` | ObjectId | ref: `users` |
| `alertThresholds.doorOpenMinutes` | Number | default: 5 |
| `alertThresholds.offlineMinutes` | Number | default: 10 |

#### `sensorreadings`
| Field | Type | Notes |
|---|---|---|
| `device` | ObjectId | ref: `devices` |
| `deviceId` | String | denormalized for query speed |
| `temperature` | Number | −50 to 100 |
| `humidity` | Number | 0–100 |
| `doorStatus` | enum | `open` / `closed` |
| `voc` | Number | 0–65535 |
| `compressor` | Boolean | |
| `timestamp` | Date | indexed, TTL: 90 days |
| `isAlert` | Boolean | flagged on threshold breach |

**Indexes:** `{ device, timestamp: -1 }`, `{ deviceId, timestamp: -1 }`, TTL

#### `alerts`
| Field | Type | Notes |
|---|---|---|
| `device` | ObjectId | ref: `devices` |
| `alertType` | enum | `temperature_high/low`, `humidity_high/low`, `door_open`, `device_offline`, `no_data` |
| `severity` | enum | `low / medium / high / critical` |
| `message` | String | max 500 |
| `value` | Number | actual reading |
| `threshold` | Number | limit breached |
| `status` | enum | `active / acknowledged / resolved` |
| `acknowledgedBy` | ObjectId | ref: `users` |
| `resolvedBy` | ObjectId | ref: `users` |
| `sensorReading` | ObjectId | ref: `sensorreadings` |

#### `storageunits`
| Field | Type | Notes |
|---|---|---|
| `unitId` | String | unique, uppercase, 2–20 chars |
| `capacityTons` | Number | 0.1–1000 |
| `currentStockKg` | Number | default: 0 |
| `assignedVegetable` | ObjectId | ref: `vegetables` |
| `assignedDevices` | [ObjectId] | ref: `devices` |
| **Virtuals** | | `maxCapacityKg`, `availableCapacityKg`, `usagePercentage` |

#### `vegetables`
| Field | Type | Notes |
|---|---|---|
| `name` | String | unique |
| `temperature.min/max` | Number | alert thresholds |
| `humidity.min/max` | Number | alert thresholds (0–100) |
| `storageDurationDays` | Number | min: 1 |

#### `roles`
| Field | Type | Notes |
|---|---|---|
| `name` | enum | `super_admin / admin / operator / viewer` |
| `permissions` | Array | `[{ resource, actions[] }]` |

#### `refreshtokens`
Auto-expires via TTL index on `expiresAt`.

#### `auditlogs`
Tracks CREATE / UPDATE / DELETE with user, resource, timestamp. TTL: 1 year.

### Relationships

```
User ─── role ──────────────────► Role
User ─── assignedDevices ────────► [Device]
Device ─── assignedVegetable ────► Vegetable
StorageUnit ─── assignedVegetable ► Vegetable
StorageUnit ─── assignedDevices ──► [Device]
SensorReading ─── device ────────► Device
Alert ─── device ────────────────► Device
Alert ─── acknowledgedBy ────────► User
Alert ─── sensorReading ─────────► SensorReading
```

---

## API Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Interactive Docs:** `http://localhost:5000/api-docs` (Swagger UI)

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-06-12T10:00:00.000Z"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "total": 50, "page": 1, "limit": 20,
      "totalPages": 3, "hasNextPage": true, "hasPrevPage": false
    }
  }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "is required" }]
}
```

---

### Authentication Routes — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Returns `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh-token` | None | Rotate refresh token |
| POST | `/auth/logout` | Bearer | Revoke current session |
| POST | `/auth/logout-all` | Bearer | Revoke all sessions |
| GET | `/auth/me` | Bearer | Current user profile |

**Login Request:**
```json
{ "email": "admin@coldstorage.com", "password": "Admin@1234" }
```
**Login Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "_id": "...", "name": "Admin", "email": "...", "role": { "name": "admin" } }
}
```

---

### Device Routes — `/api/v1/devices`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/devices` | Bearer | Any | List (scoped by role) |
| POST | `/devices` | Bearer | admin+ | Create device |
| GET | `/devices/:id` | Bearer | Any | Single device |
| PUT | `/devices/:id` | Bearer | admin+ | Update device |
| DELETE | `/devices/:id` | Bearer | admin+ | Delete device |
| POST | `/devices/:id/vegetable` | Bearer | admin+ | Assign vegetable profile |
| DELETE | `/devices/:id/vegetable` | Bearer | admin+ | Remove vegetable profile |

**Create Device Request:**
```json
{
  "deviceId": "CS001",
  "name": "Cold Store Unit 1",
  "location": "Block A, Shelf 3",
  "description": "Potato storage",
  "assignedVegetable": "64f1a...",
  "alertThresholds": { "doorOpenMinutes": 5, "offlineMinutes": 10 }
}
```

---

### Sensor Routes — `/api/v1/sensors`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/sensors` | **None** | Ingest single reading (ESP32) |
| POST | `/sensors/ingest-batch` | **None** | Batch ingest (max 20) |
| GET | `/sensors/:deviceId/latest` | Bearer | Latest reading |
| GET | `/sensors/:deviceId/history` | Bearer | Historical (paginated) |
| GET | `/sensors/:deviceId/stats` | Bearer | Min/max/avg stats |

**Single Ingest (ESP32 native format):**
```json
{
  "deviceId": "CS001",
  "temp": 4.2,
  "hum": 85.3,
  "door": false,
  "voc": 120,
  "compressor": true,
  "timestamp": "2026-06-12T10:00:00.000Z"
}
```
*Also accepts legacy aliases: `temperature`, `humidity`, `doorStatus` (`"open"/"closed"`).*

**Batch Ingest:**
```json
{
  "device_id": "CS001",
  "readings": [
    { "deviceId": "CS001", "temp": 4.2, "hum": 85.3, "door": false },
    { "deviceId": "CS001", "temp": 4.5, "hum": 84.8, "door": false }
  ]
}
```

**Stats Response:**
```json
{
  "data": {
    "deviceId": "CS001",
    "hours": 24,
    "temperature": { "min": 2.1, "max": 6.8, "avg": 4.3 },
    "humidity": { "min": 80.0, "max": 90.2, "avg": 85.1 },
    "totalReadings": 1440
  }
}
```

---

### Alert Routes — `/api/v1/alerts`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/alerts` | Bearer | Any | List (scoped) |
| GET | `/alerts/:id` | Bearer | Any | Single alert |
| PATCH | `/alerts/:id/acknowledge` | Bearer | operator+ | Acknowledge alert |
| PATCH | `/alerts/:id/resolve` | Bearer | operator+ | Resolve alert |
| DELETE | `/alerts/:id` | Bearer | admin+ | Delete alert |

**Query Parameters for GET /alerts:**
- `status`: `active` / `acknowledged` / `resolved`
- `severity`: `low` / `medium` / `high` / `critical`
- `alertType`: `temperature_high` etc.
- `page`, `limit`

---

### Dashboard Routes — `/api/v1/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | Bearer | Device counts, alert summary |
| GET | `/dashboard/device-health` | Bearer | Per-device temp/humidity ranges |
| GET | `/dashboard/temperature-overview` | Bearer | Aggregated temp trend (`?hours=24`) |
| GET | `/dashboard/alerts-by-device` | Bearer | Active alert counts by device |
| GET | `/dashboard/my-devices` | Bearer | Assigned devices with stats |

---

### Storage Unit Routes — `/api/v1/storage-units`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/storage-units` | Bearer | Any | List all units |
| POST | `/storage-units` | Bearer | admin+ | Create unit |
| GET | `/storage-units/:id` | Bearer | Any | Single unit |
| PUT | `/storage-units/:id` | Bearer | admin+ | Update unit |
| DELETE | `/storage-units/:id` | Bearer | admin+ | Delete unit |
| GET | `/storage-units/:id/capacity` | Bearer | Any | Capacity simulation (`?vegetable=potato&addStockKg=500`) |
| POST | `/storage-units/:id/devices` | Bearer | admin+ | Assign device |
| DELETE | `/storage-units/:id/devices/:deviceId` | Bearer | admin+ | Remove device |
| POST | `/storage-units/:id/vegetable` | Bearer | admin+ | Assign vegetable |
| DELETE | `/storage-units/:id/vegetable` | Bearer | admin+ | Remove vegetable |
| PATCH | `/storage-units/:id/stock` | Bearer | admin+ | Update current stock |

---

### User Routes — `/api/v1/users`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users` | Bearer | admin+ | List users (search, filter) |
| POST | `/users` | Bearer | admin+ | Create user |
| GET | `/users/:id` | Bearer | admin+ | Single user |
| PUT | `/users/:id` | Bearer | admin+ | Update user |
| DELETE | `/users/:id` | Bearer | admin+ | Delete user |
| PATCH | `/users/:id/activate` | Bearer | admin+ | Activate account |
| PATCH | `/users/:id/deactivate` | Bearer | admin+ | Deactivate account |
| POST | `/users/:id/devices` | Bearer | admin+ | Assign devices (bulk) |
| DELETE | `/users/:id/devices` | Bearer | admin+ | Remove devices (bulk) |

---

### Vegetable Routes — `/api/v1/vegetables`

Standard CRUD. Read: any role. Write: admin+.

---

## Authentication & RBAC

### Token Flow

```
Login → { accessToken (15m), refreshToken (7d) }
         │
         ├─ All API requests: Authorization: Bearer <accessToken>
         │
         └─ On 401: POST /auth/refresh-token
                        │
                        ├─ New { accessToken, refreshToken }
                        └─ Old refresh token revoked (rotation)
```

### Role Permission Matrix

| Resource | Action | super_admin | admin | operator | viewer |
|---|---|:---:|:---:|:---:|:---:|
| users | create/update/delete | ✅ | ✅ | ✗ | ✗ |
| users | read | ✅ | ✅ | ✅ | ✗ |
| devices | CRUD | ✅ | ✅ | ✗ | ✗ |
| devices | read | ✅ | ✅ | ✅ (assigned) | ✅ (assigned) |
| sensors | create | ✅ | ✅ | ✅ | ✗ |
| sensors | read | ✅ | ✅ | ✅ (assigned) | ✅ (assigned) |
| alerts | read | ✅ | ✅ | ✅ | ✅ |
| alerts | acknowledge | ✅ | ✅ | ✅ | ✗ |
| alerts | delete | ✅ | ✗ | ✗ | ✗ |
| vegetables | CRUD | ✅ | ✅ | read | read |
| storage_units | CRUD | ✅ | ✅ | read | read |
| dashboard | read | ✅ | ✅ | ✅ | ✅ |
| audit_logs | read | ✅ | ✅ | ✗ | ✗ |

> **Super admin** bypasses all permission checks.  
> **Operators and viewers** only see their `assignedDevices`; `deviceAccess` middleware enforces this automatically.

---

## Real-Time Events

**Protocol:** Socket.IO over HTTP  
**Auth:** JWT token in `socket.handshake.auth.token`

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `sensor:reading` | `{ deviceId, temperature, humidity, doorStatus, voc, compressor, timestamp }` | New sensor reading ingested |
| `device:status` | `{ deviceId, status }` | Device went online/offline |
| `alert:new` | Full alert object | New alert created |
| `alert:acknowledged` | Full alert object | Alert acknowledged |
| `alert:resolved` | Full alert object | Alert resolved |
| `dashboard:update` | Summary payload | Dashboard stats refreshed |

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `join:device` | `{ deviceId }` | Subscribe to device room |
| `leave:device` | `{ deviceId }` | Unsubscribe from device room |
| `join:dashboard` | — | Subscribe to global dashboard room |

### Rooms

- `dashboard` — all connected authenticated clients auto-join
- `device:{deviceId}` — per-device subscribers (operators watching a specific unit)

---

## Installation & Setup

### Prerequisites

- Node.js ≥ 18.0.0
- MongoDB ≥ 6.0
- npm ≥ 9.x

### 1. Clone & Configure

```bash
git clone <repo-url>
cd COLD_STORAGE
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
```

**Initialize database with seed data:**
```bash
npm run seed
```
This creates roles, 4 sample users, 5 vegetables, 5 devices, and 2 storage units.

**Development server:**
```bash
npm run dev        # nodemon on port 5000
```

**Production server:**
```bash
npm start          # node server.js
```

### 3. Web Dashboard Setup

```bash
cd client
npm install
npm start          # http://localhost:3000
```

Build for production:
```bash
npm run build      # ./build/ directory
```

### 4. Mobile App Setup

```bash
cd MobileApp
npm install
npm start          # Expo Dev Tools
# Press 'a' → Android emulator
# Press 'i' → iOS simulator
# Scan QR → physical device
```

### 5. Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@coldstorage.com | Admin@1234 |
| Admin | admin@coldstorage.com | Admin@1234 |
| Operator | operator@coldstorage.com | Operator@1234 |
| Viewer | viewer@coldstorage.com | Viewer@1234 |

> **Change these immediately in any non-local environment.**

### 6. ESP32 Integration

Flash the ESP32 with your Wi-Fi credentials and set the API endpoint to:
```
POST http://<server-ip>:5000/api/v1/sensors
Content-Type: application/json

{
  "deviceId": "CS001",
  "temp": 4.2,
  "hum": 85.3,
  "door": false,
  "voc": 120,
  "compressor": true
}
```
No authentication required for sensor ingestion.

---

## Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/cold_storage_db
MONGODB_URI_PROD=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cold_storage_db

# JWT — MUST change before production
JWT_SECRET=<min-32-char-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<min-32-char-random-string>
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Alerting Thresholds
DOOR_OPEN_ALERT_MINUTES=5
DEVICE_OFFLINE_MINUTES=10

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Seed Credentials
SEED_ADMIN_EMAIL=superadmin@coldstorage.com
SEED_ADMIN_PASSWORD=Admin@1234
```

---

## Deployment

### PM2 (Recommended for Linux VPS)

```bash
cd server
npm install -g pm2
pm2 start ecosystem.config.js    # Start in cluster mode
pm2 save                          # Persist across reboots
pm2 startup                       # Auto-start on boot
pm2 logs cold-storage-api         # View logs
pm2 monit                         # Live monitor
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # React build
    location / {
        root /var/www/cold-storage/client/build;
        try_files $uri /index.html;
    }

    # API + Socket.IO
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Docker (Self-managed)

A `docker-compose.yml` would include: `mongodb`, `cold-storage-api`, `cold-storage-client` services. *(Not yet included in repo — see Future Scope.)*

### MongoDB Atlas

Set `MONGODB_URI_PROD` in `.env` and ensure IP whitelist includes your server's public IP.

---

## Known Issues & Improvements

### Security Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Sensor ingest endpoints (`POST /sensors`, `/sensors/ingest-batch`) have **no authentication**. Any device on the network can inject fake readings. | High | Add device-level API key or HMAC signature verification for ESP32 |
| 2 | `JWT_SECRET` and `JWT_REFRESH_SECRET` default to example values in `.env.example`. If copied without change, tokens are predictable. | Critical | Enforce minimum 32-char entropy check at startup |
| 3 | Seed script uses hardcoded default passwords (`Admin@1234`). | Medium | Force password change on first login or use env-based seed passwords |
| 4 | No HTTPS enforcement in backend — relies on Nginx. If accidentally exposed directly, traffic is unencrypted. | Medium | Add `app.set('trust proxy', 1)` and redirect HTTP in code |
| 5 | `xss-clean` package is deprecated and unmaintained. | Low | Replace with `dompurify` server-side or sanitize in validators |

### Bugs / Weak Points

| # | Issue | Location |
|---|---|---|
| 1 | The `no-data` cron job reuses `DEVICE_OFFLINE_MINUTES` env var as its threshold — there is no separate `NO_DATA_MINUTES` configuration. | `cronJobs.js:38` |
| 2 | Batch sensor ingest (`ingest-batch`) creates alerts per reading independently, which can cause duplicate alerts for the same condition in one batch. No deduplication logic. | `SensorService.js` |
| 3 | `StorageUnitService.calculateCapacity` uses a packing density lookup that falls back to `default: 500` silently for unknown vegetables, which may give misleading capacity estimates. | `constants.js:104` |
| 4 | Client-side `crypto-js` dependency is present in `client/package.json` but there is no evidence it is used in the current screen components. Dead dependency. | `client/package.json` |
| 5 | Mobile app `config/env.js` hardcodes `localhost` for the API base URL, which will fail on physical devices. Should use the machine's local IP or a `.env` file. | `MobileApp/src/config/env.js` |
| 6 | No pagination on `GET /vegetables` — returns all records. Fine for dozens of records, but will degrade as catalog grows. | `VegetableController.js` |

### Performance Improvements

| # | Improvement |
|---|---|
| 1 | Add Redis caching for dashboard summary and device-health endpoints — these are read-heavy and recalculated on every request |
| 2 | The `GET /dashboard/temperature-overview` aggregation runs a `$match + $group` over `sensorreadings` every call. Cache at 60s TTL. |
| 3 | Add a MongoDB compound index `{ deviceId: 1, alertType: 1, status: 1 }` to speed up duplicate alert detection |
| 4 | Socket.IO broadcasts `dashboard:update` on every sensor ingest. Debounce to once per 5 seconds per device to reduce unnecessary re-renders |

### Best Practice Suggestions

| # | Suggestion |
|---|---|
| 1 | Add integration tests (Jest + Supertest) — currently zero test coverage |
| 2 | Add a `CHANGELOG.md` and semantic versioning |
| 3 | Replace `react-scripts` (CRA) with Vite for significantly faster dev builds and smaller production bundles |
| 4 | Add `helmet` Content Security Policy headers with explicit allow-lists for the React dashboard |
| 5 | Move Swagger spec to a separate YAML file and auto-validate against actual route implementations in CI |
| 6 | Add `.dockerignore` and `Dockerfile` for containerized deployment |

---

## Future Scope

- [ ] **Device API key authentication** — HMAC-signed payloads from ESP32 with per-device secrets
- [ ] **Email / SMS notifications** — SendGrid / Twilio integration for critical alerts
- [ ] **Multi-tenant support** — Organization-level data isolation for SaaS deployment
- [ ] **Grafana / InfluxDB integration** — Advanced time-series dashboards and long-term analytics
- [ ] **Docker Compose** — One-command local and production deployment
- [ ] **CI/CD pipeline** — GitHub Actions for test, build, and deploy
- [ ] **OTA firmware updates** — Push ESP32 firmware updates remotely via the backend
- [ ] **Predictive alerts** — ML-based anomaly detection on sensor streams (temperature trends before spoilage)
- [ ] **PDF reports** — Automated daily/weekly cold chain compliance reports
- [ ] **Barcode / QR scanning** — Mobile app scan to quickly navigate to device detail
- [ ] **Offline mobile sync** — Queue sensor acknowledgments when mobile app loses connectivity
- [ ] **Redis pub/sub** — Replace in-process Socket.IO with Redis adapter for horizontal scaling

---

## License

MIT © 2026 SEPL Engineering
