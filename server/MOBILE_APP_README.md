# Cold Storage Monitoring — Mobile App

A complete guide to every screen, feature, and module for the mobile application.

---

## What Does This App Do?

This app lets you **monitor cold storage rooms** (like warehouses that store vegetables) from your phone.

- See temperature and humidity of each storage unit **live**
- Get **instant alerts** when something goes wrong (too hot, door open, etc.)
- Manage devices, users, and vegetable storage profiles
- Different people see different things based on their **role**

---

## Who Uses This App?

| Role | What They Can Do |
|------|-----------------|
| **Super Admin** | Everything — manage users, devices, all data |
| **Admin** | Same as Super Admin (cannot delete Super Admins) |
| **Operator** | View their assigned devices, send sensor data, acknowledge alerts |
| **Viewer** | View only — read their assigned devices and alerts, no editing |

---

## App Navigation Structure

```
App
├── Auth Screens (before login)
│   ├── Splash Screen
│   ├── Login Screen
│   └── Forgot Password Screen
│
└── Main App (after login)
    ├── Bottom Tab Bar
    │   ├── Dashboard (Home)
    │   ├── Devices
    │   ├── Alerts
    │   └── Profile
    │
    └── Stack Screens (opened from tabs)
        ├── Device Detail
        ├── Sensor History
        ├── Alert Detail
        ├── Vegetable List / Detail
        ├── User List / Detail
        └── Settings
```

---

## All Screens — Module by Module

---

### MODULE 1: Authentication

---

#### Screen 1.1 — Splash Screen

**What the user sees:**
- App logo in the center
- App name: "Cold Storage Monitor"
- Short loading animation (2 seconds)
- Automatically goes to Login if not logged in, or Dashboard if already logged in

**Simple Explanation:**
> This is the first screen that shows when you open the app. It checks if you are already logged in.

---

#### Screen 1.2 — Login Screen

**What the user sees:**
- App logo at top
- Title: "Sign In"
- Email input field
- Password input field (with show/hide toggle)
- "Login" button
- Error message (shown in red if wrong email/password)

**What happens:**
1. User enters email and password
2. App calls `POST /api/v1/auth/login`
3. App saves the **access token** (15 min) and **refresh token** (7 days) securely
4. Goes to Dashboard

**Simple Explanation:**
> Enter your email and password to get in. The app remembers you for 7 days so you don't have to log in every time.

**Example credentials (for testing):**
```
Super Admin : superadmin@coldstorage.com / Admin@1234
Admin       : admin@coldstorage.com / Admin@1234
Operator    : operator@coldstorage.com / Operator@1234
Viewer      : viewer@coldstorage.com / Viewer@1234
```

---

### MODULE 2: Dashboard (Home Screen)

---

#### Screen 2.1 — Dashboard Home

**What the user sees:**

```
┌─────────────────────────────────┐
│  Good Morning, Ramesh 👋         │
│  Thursday, 5 Jun 2026           │
├─────────────────────────────────┤
│  SUMMARY CARDS (horizontal row) │
│                                 │
│  [5 Total]  [2 Online]          │
│  Devices    Devices             │
│                                 │
│  [4 Active] [2 High]            │
│  Alerts     Alerts              │
├─────────────────────────────────┤
│  MY DEVICES  (scrollable list)  │
│                                 │
│  ● CS001 — Storage Unit A       │
│    Potato | 5.4°C | 88%        │
│    ✅ Normal                    │
│                                 │
│  ● CS002 — Storage Unit B       │
│    Onion | 2.5°C | 70%         │
│    ⚠️ 1 Alert                   │
│                                 │
├─────────────────────────────────┤
│  RECENT ALERTS                  │
│  🔴 CS001 — Temp HIGH  5 min ago│
│  🟡 CS002 — Door Open 12 min ago│
└─────────────────────────────────┘
```

**Cards shown:**
- Total Devices | Online Devices | Offline Devices
- Total Active Alerts | High Severity Alerts
- Recent Sensor Readings for assigned devices

**Role differences:**
- Super Admin / Admin: Sees ALL devices (CS001–CS005) and ALL alerts
- Operator: Sees only their 2 assigned devices
- Viewer: Sees only their 1 assigned device, read-only

**Simple Explanation:**
> This is your home screen. One glance shows you if anything is wrong across your storage units.

---

#### Screen 2.2 — Temperature Overview Chart

**What the user sees:**
- Line chart showing temperature trends for last 24 hours
- One line per device (different color)
- Toggle: 24h / 48h / 7 days
- Red band showing danger zone (above vegetable max temp)

**Simple Explanation:**
> A graph showing how temperature has changed over time across all your storage units. If the line goes into the red zone, something is wrong.

---

### MODULE 3: Devices

---

#### Screen 3.1 — Device List Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  Devices              [+ Add]   │
│  [Search bar]    [Filter ▼]     │
├─────────────────────────────────┤
│  ● CS001 — Storage Unit A       │
│    📍 Warehouse Block 1 North   │
│    🌡 5.4°C  💧 88%  🚪 Closed  │
│    Status: 🟢 Online            │
│    Vegetable: 🥔 Potato         │
├─────────────────────────────────┤
│  ● CS002 — Storage Unit B       │
│    📍 Warehouse Block 1 South   │
│    🌡 2.5°C  💧 70%  🚪 Closed  │
│    Status: 🟢 Online            │
│    Vegetable: 🧅 Onion          │
├─────────────────────────────────┤
│  ● CS003 — Storage Unit C       │
│    📍 Warehouse Block 2 East    │
│    🌡 ---   💧 ---  🚪 ---      │
│    Status: 🔴 Offline           │
│    Vegetable: 🍅 Tomato         │
└─────────────────────────────────┘
```

**Status indicators:**
- 🟢 Green dot = Online (receiving data)
- 🔴 Red dot = Offline (no data received)
- 🟡 Yellow dot = Maintenance

**Filter options:**
- All / Online / Offline / Maintenance
- Search by device name or ID

**Who sees it:**
- Admin/SA: All 5 devices
- Operator/Viewer: Only their assigned devices

**Simple Explanation:**
> A list of all your storage units. Each card shows current temperature, humidity, and door status at a glance.

---

#### Screen 3.2 — Device Detail Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  ← Storage Unit A (CS001)  [✏️] │
├─────────────────────────────────┤
│  Status: 🟢 Online              │
│  Last Updated: 2 min ago        │
│  Location: Warehouse Block 1    │
│  Vegetable: Potato              │
├─────────────────────────────────┤
│  CURRENT READINGS               │
│                                 │
│  🌡️ Temperature                 │
│     5.4°C  (Safe: 2–8°C)        │
│     ████████░░ 68%              │
│     Status: ✅ Normal            │
│                                 │
│  💧 Humidity                    │
│     88%  (Safe: 85–95%)         │
│     ████████░░ 92%              │
│     Status: ✅ Normal            │
│                                 │
│  🚪 Door Status: CLOSED         │
├─────────────────────────────────┤
│  [View History]  [View Alerts]  │
│  [View Stats]                   │
├─────────────────────────────────┤
│  ASSIGNED VEGETABLE             │
│  🥔 Potato                      │
│  Temp Range: 2–8°C              │
│  Humidity: 85–95%               │
│  Max Storage: 90 days           │
│  [Change Vegetable] [Remove]    │
└─────────────────────────────────┘
```

**What the progress bar means:**
- Green = safe zone
- Orange = near threshold
- Red = out of range (alert triggered)

**Buttons shown based on role:**
- Admin/SA: Edit device, Change vegetable, View all
- Operator: View history, View alerts, Ingest reading
- Viewer: View only, no edit buttons

**Simple Explanation:**
> Tap any device to see everything about it — current readings, whether it's safe, and what vegetable is stored inside.

---

#### Screen 3.3 — Add/Edit Device Screen (Admin only)

**What the user sees:**
- Form with fields:
  - Device ID (e.g., CS006) — letters and numbers only
  - Device Name (e.g., Storage Unit F)
  - Location (e.g., Warehouse Block 4)
  - Description (optional)
  - Door Open Alert Threshold (minutes, default: 5)
  - Offline Alert Threshold (minutes, default: 10)
- Save button / Cancel button

**Simple Explanation:**
> This form lets admins add a new storage unit to the system or update an existing one.

---

#### Screen 3.4 — Sensor History Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  ← CS001 Sensor History         │
│  [Today] [7 Days] [Custom]      │
├─────────────────────────────────┤
│  Line Chart: Temperature        │
│  (scrollable, pinch to zoom)    │
├─────────────────────────────────┤
│  Line Chart: Humidity           │
│  (scrollable, pinch to zoom)    │
├─────────────────────────────────┤
│  READINGS LIST                  │
│  10:45 AM │ 5.4°C │ 88% │ 🚪 C │
│  10:30 AM │ 5.2°C │ 87% │ 🚪 C │
│  10:15 AM │ 5.5°C │ 88% │ 🚪 O │
│  10:00 AM │ 5.3°C │ 89% │ 🚪 C │
│  (load more...)                 │
└─────────────────────────────────┘
```

**Filter options:**
- Date range picker
- Door status filter (Open / Closed / All)

**Simple Explanation:**
> See all past readings for a device. The charts show if temperature or humidity was unstable over time.

---

#### Screen 3.5 — Device Stats Screen

**What the user sees:**
- Time period toggle: Last 24h / 48h / 7 days
- Stats cards:
  - Average Temperature
  - Minimum Temperature
  - Maximum Temperature
  - Average Humidity
  - Total Readings Count
  - Door Open Events count

**Simple Explanation:**
> A summary page showing the highs, lows, and averages for any device over a selected time period.

---

### MODULE 4: Alerts

---

#### Screen 4.1 — Alert List Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  Alerts                [Filter] │
│  [Active 4] [Acknowledged 2]    │
│  [Resolved 10]                  │
├─────────────────────────────────┤
│  🔴 HIGH — CS001                │
│  Temperature HIGH               │
│  15.8°C > max 8°C               │
│  5 minutes ago                  │
│  [Acknowledge]                  │
├─────────────────────────────────┤
│  🟡 MEDIUM — CS001              │
│  Humidity LOW                   │
│  80% < min 85%                  │
│  12 minutes ago                 │
│  [Acknowledge]                  │
├─────────────────────────────────┤
│  🔴 HIGH — CS002                │
│  Door OPEN > 5 minutes          │
│  Door open for 7 min            │
│  18 minutes ago                 │
│  [Acknowledge]                  │
└─────────────────────────────────┘
```

**Alert type badges:**
| Color | Severity |
|-------|----------|
| 🔴 Red | HIGH / CRITICAL |
| 🟡 Yellow | MEDIUM |
| 🔵 Blue | LOW |

**Alert types explained simply:**
- **Temperature HIGH** — Storage too warm (vegetable may spoil)
- **Temperature LOW** — Storage too cold (vegetable may freeze)
- **Humidity HIGH** — Too much moisture (mold risk)
- **Humidity LOW** — Too dry (vegetable may shrivel)
- **Door Open** — Door left open for too long
- **Device Offline** — No readings received (device may be broken)

**Filters:**
- Status: Active / Acknowledged / Resolved / All
- Severity: High / Medium / Low / All
- Alert Type: Temperature / Humidity / Door / Offline
- Device: Pick specific device
- Date Range

**Simple Explanation:**
> This screen shows everything that went wrong. Red = serious problem, Yellow = warning, Blue = minor issue. Tap "Acknowledge" to confirm you've seen it.

---

#### Screen 4.2 — Alert Detail Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  ← Alert Details                │
├─────────────────────────────────┤
│  🔴 TEMPERATURE HIGH            │
│  CS001 — Storage Unit A         │
├─────────────────────────────────┤
│  Value Detected:  15.8°C        │
│  Safe Maximum:    8.0°C         │
│  Exceeded by:     7.8°C         │
│                                 │
│  Stored Vegetable: 🥔 Potato    │
│  Safe Range:       2°C – 8°C    │
├─────────────────────────────────┤
│  Alert Created:   5 Jun, 10:45  │
│  Status:          🔴 Active     │
├─────────────────────────────────┤
│  TIMELINE                       │
│  ● 10:45 AM — Alert created     │
│  ○ Not yet acknowledged         │
│  ○ Not yet resolved             │
├─────────────────────────────────┤
│  [Acknowledge Alert]            │
│  [Resolve Alert]  (SA/Admin)    │
└─────────────────────────────────┘
```

**Simple Explanation:**
> Full details of one alert — what happened, how bad it is, when it happened, and who dealt with it.

---

### MODULE 5: Vegetables (Storage Profiles)

---

#### Screen 5.1 — Vegetable List Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  Storage Profiles      [+ Add]  │
│  [Search bar]                   │
├─────────────────────────────────┤
│  🥔 Potato                      │
│  Temp: 2–8°C  |  Humid: 85–95% │
│  Max Storage: 90 days           │
│  Used by: CS001                 │
├─────────────────────────────────┤
│  🧅 Onion                       │
│  Temp: 0–5°C  |  Humid: 65–75% │
│  Max Storage: 180 days          │
│  Used by: CS002                 │
├─────────────────────────────────┤
│  🍅 Tomato                      │
│  Temp: 8–12°C | Humid: 85–95%  │
│  Max Storage: 14 days           │
│  Used by: CS003                 │
└─────────────────────────────────┘
```

**Simple Explanation:**
> Each vegetable has a "storage profile" — the ideal temperature and humidity range for that vegetable. This list shows all profiles and which device uses each one.

---

#### Screen 5.2 — Vegetable Detail Screen

**What the user sees:**
- Vegetable name and description
- Temperature range (min–max in °C)
- Humidity range (min–max in %)
- Maximum storage duration (days)
- List of devices currently using this profile
- Edit / Delete buttons (Admin only)

**Simple Explanation:**
> Detailed info about one vegetable's storage requirements.

---

#### Screen 5.3 — Add/Edit Vegetable Screen (Admin only)

**What the user sees:**
- Form fields:
  - Name (e.g., "Broccoli")
  - Description (optional)
  - Min Temperature (°C)
  - Max Temperature (°C)
  - Min Humidity (%)
  - Max Humidity (%)
  - Max Storage Duration (days)
- Validation: Min must be less than Max for both temperature and humidity

**Simple Explanation:**
> Admins can add new vegetables or update safe storage conditions for existing ones.

---

### MODULE 6: Users (Admin only)

---

#### Screen 6.1 — User List Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  Users                 [+ Add]  │
│  [Search]      [Filter by Role] │
│  All | Active | Inactive        │
├─────────────────────────────────┤
│  👤 Ramesh Kumar                │
│  operator@coldstorage.com       │
│  Role: Operator                 │
│  Devices: CS001, CS002          │
│  Status: 🟢 Active              │
├─────────────────────────────────┤
│  👤 Priya Sharma                │
│  viewer@coldstorage.com         │
│  Role: Viewer                   │
│  Devices: None                  │
│  Status: 🟢 Active              │
└─────────────────────────────────┘
```

**Filters:**
- Role: All / Super Admin / Admin / Operator / Viewer
- Status: All / Active / Inactive
- Search by name or email

**Simple Explanation:**
> Super Admins and Admins use this to see all the people who have access to the system.

---

#### Screen 6.2 — User Detail Screen

**What the user sees:**
- Name, email, phone number
- Role badge (Super Admin / Admin / Operator / Viewer)
- Status: Active or Inactive
- Last login time
- Assigned devices list (with device IDs and names)
- Action buttons:
  - Edit user
  - Activate / Deactivate account
  - Manage device assignments
  - Delete user

**Simple Explanation:**
> Full profile of one user — who they are, what role they have, and which storage units they can access.

---

#### Screen 6.3 — Add/Edit User Screen (Admin only)

**What the user sees:**
- Form fields:
  - Full Name
  - Email address
  - Password (for new user) / Change Password (for existing)
  - Role (dropdown: Operator / Viewer / Admin)
  - Phone number (optional)
- Save / Cancel buttons

**Simple Explanation:**
> Create a new user account or update an existing user's info.

---

#### Screen 6.4 — Assign Devices to User Screen (Admin only)

**What the user sees:**
- User name at top
- Full list of all devices (checkboxes)
- Currently assigned devices are already checked
- Save button to confirm assignment

**Simple Explanation:**
> Choose which storage units an Operator or Viewer can see and manage. For example, assign CS001 and CS002 to the night-shift operator.

---

### MODULE 7: Sensor Data Ingestion (Operator only)

---

#### Screen 7.1 — Manual Reading Entry Screen

**What the user sees:**

```
┌─────────────────────────────────┐
│  ← Enter Sensor Reading         │
├─────────────────────────────────┤
│  Device: [CS001 ▼]              │
├─────────────────────────────────┤
│  Temperature (°C)               │
│  [____5.4____]                  │
│                                 │
│  Humidity (%)                   │
│  [____88_____]                  │
│                                 │
│  Door Status                    │
│  ○ Closed   ● Open              │
│                                 │
│  Timestamp                      │
│  ● Now  ○ Custom                │
├─────────────────────────────────┤
│  [Submit Reading]               │
├─────────────────────────────────┤
│  RESULT (shown after submit):   │
│  ✅ Reading saved!               │
│  ⚠️ 1 Alert Generated           │
│  → Humidity LOW: 88% < 85% min  │
└─────────────────────────────────┘
```

**Note:** In production, IoT devices send readings automatically. This screen is for manual data entry when needed.

**Simple Explanation:**
> Operators can manually enter temperature, humidity, and door status for any of their assigned devices. After submitting, the app immediately tells you if any alerts were triggered.

---

### MODULE 8: Profile & Settings

---

#### Screen 8.1 — My Profile Screen

**What the user sees:**
- Profile avatar / initials
- Name, email, phone number
- Role badge
- Last login time
- Assigned devices (for Operator/Viewer)
- "Edit Profile" button
- "Change Password" button
- "Logout" button

**Simple Explanation:**
> Your personal account page. See your role, update your phone number, or change your password.

---

#### Screen 8.2 — Change Password Screen

**What the user sees:**
- Current password field
- New password field
- Confirm new password field
- Password strength indicator
- Save button
- Password rules shown: min 8 chars, 1 uppercase, 1 number, 1 special character

**Simple Explanation:**
> Change your login password here. The password must be strong enough (the app will tell you if it's weak).

---

#### Screen 8.3 — Notifications / Alert Settings Screen

**What the user sees:**
- Toggle: Push Notifications — ON/OFF
- Alert types to be notified about (checkboxes):
  - Temperature alerts
  - Humidity alerts
  - Door open alerts
  - Device offline alerts
- Severity filter: All / High & Critical only / Critical only
- Sound / Vibration settings

**Simple Explanation:**
> Choose which alerts you want to be notified about on your phone. For example, you might only want notifications for critical issues, not every minor alert.

---

#### Screen 8.4 — App Settings Screen

**What the user sees:**
- Theme: Light / Dark / System Default
- Temperature unit: Celsius / Fahrenheit
- Dashboard refresh interval: 30s / 1min / 5min
- Auto-logout after inactivity: 15min / 30min / 1hr / Never
- App version info
- Server URL (editable for pointing to different environments)
- "Logout from all devices" button

**Simple Explanation:**
> Customize how the app works for you.

---

### MODULE 9: Real-Time Features (Live Updates)

The app connects to the server via **Socket.IO** for live data. No need to refresh manually.

**What happens automatically:**

| Event | What you see |
|-------|-------------|
| New sensor reading arrives | Device card updates immediately (new temp/humidity) |
| Alert triggered | Red badge appears on Alert tab, push notification sent |
| Alert acknowledged | Alert card updates to "Acknowledged" in real time |
| Device goes offline | Device status changes to 🔴 Offline immediately |
| Device comes back online | Device status changes to 🟢 Online immediately |
| Dashboard data changes | Summary cards update automatically |

**Connection status indicator:**
- 🟢 Small green dot in header = Connected (live)
- 🟡 Yellow dot = Reconnecting...
- 🔴 Red dot = Offline (showing cached data)

**Simple Explanation:**
> The app is always connected to the server. If a storage unit's temperature spikes, you'll see it on your screen within seconds — no need to refresh.

---

## Screen Count Summary

| Module | Screens |
|--------|---------|
| Authentication | Splash, Login, Forgot Password = **3 screens** |
| Dashboard | Home, Temperature Chart = **2 screens** |
| Devices | List, Detail, Add/Edit, Sensor History, Stats = **5 screens** |
| Alerts | List, Detail = **2 screens** |
| Vegetables | List, Detail, Add/Edit = **3 screens** |
| Users (Admin) | List, Detail, Add/Edit, Assign Devices = **4 screens** |
| Sensor Entry | Manual Entry = **1 screen** |
| Profile | Profile, Change Password, Notifications, App Settings = **4 screens** |
| **Total** | **24 screens** |

---

## Role-Based Screen Access Summary

| Screen | Super Admin | Admin | Operator | Viewer |
|--------|:-----------:|:-----:|:--------:|:------:|
| Dashboard | ✅ All data | ✅ All data | ✅ Own devices | ✅ Own devices |
| Device List | ✅ All | ✅ All | ✅ Assigned only | ✅ Assigned only |
| Device Detail | ✅ + Edit | ✅ + Edit | ✅ Read only | ✅ Read only |
| Add/Edit Device | ✅ | ✅ | ❌ | ❌ |
| Sensor History | ✅ | ✅ | ✅ Assigned only | ✅ Assigned only |
| Sensor Entry | ✅ | ✅ | ✅ Assigned only | ❌ |
| Alert List | ✅ All | ✅ All | ✅ Own devices | ✅ Own devices |
| Acknowledge Alert | ✅ | ✅ | ✅ | ❌ |
| Resolve Alert | ✅ | ✅ | ✅ | ❌ |
| Delete Alert | ✅ | ✅ | ❌ | ❌ |
| Vegetable List | ✅ | ✅ | ✅ | ✅ |
| Add/Edit Vegetable | ✅ | ✅ | ❌ | ❌ |
| User List | ✅ | ✅ | ❌ | ❌ |
| Add/Edit User | ✅ | ✅ | ❌ | ❌ |
| Assign Devices | ✅ | ✅ | ❌ | ❌ |
| My Profile | ✅ | ✅ | ✅ | ✅ |

---

## Recommended Tech Stack for Mobile App

### Option A — React Native (Recommended)
```
React Native         → One codebase for Android + iOS
React Navigation     → Screen navigation (bottom tabs + stack)
Zustand / Redux      → Store user data, alerts, tokens
Socket.IO Client     → Live sensor data
React Native Charts  → Temperature/humidity graphs (Victory Native)
Async Storage        → Store tokens securely
React Native Paper   → UI components
Axios                → API calls
```

### Option B — Flutter
```
Flutter              → One codebase for Android + iOS
GoRouter             → Navigation
Riverpod / Bloc      → State management
Socket.IO Client     → Live sensor data
fl_chart             → Charts
flutter_secure_storage → Store JWT tokens
```

### Option C — Native Android (Kotlin/Java)
```
Kotlin               → Android only
Jetpack Compose      → Modern Android UI
Retrofit             → API calls
OkHttp + Socket.IO   → Live data
MPAndroidChart       → Charts
DataStore            → Secure token storage
```

---

## API Endpoints Used by Mobile App

| Feature | API Call |
|---------|----------|
| Login | `POST /api/v1/auth/login` |
| Auto-refresh token | `POST /api/v1/auth/refresh-token` |
| Get my profile | `GET /api/v1/auth/me` |
| Dashboard summary | `GET /api/v1/dashboard/summary` |
| My devices with stats | `GET /api/v1/dashboard/my-devices` |
| Temperature overview chart | `GET /api/v1/dashboard/temperature-overview?hours=24` |
| Alerts by device (chart) | `GET /api/v1/dashboard/alerts-by-device` |
| All devices list | `GET /api/v1/devices` |
| Single device detail | `GET /api/v1/devices/:id` |
| Latest sensor reading | `GET /api/v1/sensors/:deviceId/latest` |
| Sensor history (list + chart) | `GET /api/v1/sensors/:deviceId/history` |
| Sensor stats | `GET /api/v1/sensors/:deviceId/stats` |
| Submit sensor reading | `POST /api/v1/sensors` |
| All alerts | `GET /api/v1/alerts` |
| Acknowledge alert | `PATCH /api/v1/alerts/:id/acknowledge` |
| Resolve alert | `PATCH /api/v1/alerts/:id/resolve` |
| All vegetables | `GET /api/v1/vegetables` |
| Create vegetable | `POST /api/v1/vegetables` |
| All users (admin only) | `GET /api/v1/users` |
| Create user (admin only) | `POST /api/v1/users` |
| Assign devices to user | `POST /api/v1/users/:id/devices` |
| Logout | `POST /api/v1/auth/logout` |

---

## Real-Time Socket.IO Events

```javascript
// Connect with auth token
const socket = io('http://your-server:5000', {
  auth: { token: accessToken }
});

// Subscribe to a specific device room
socket.emit('join:device', 'CS001');

// Listen for live sensor data
socket.on('sensor:reading', (data) => {
  // data = { deviceId, temperature, humidity, doorStatus, timestamp }
  // Update the device card on screen
});

// Listen for new alerts
socket.on('alert:new', (alert) => {
  // Show push notification, update alert badge count
});

// Listen for device going online/offline
socket.on('device:status', (data) => {
  // data = { deviceId, status, lastSeen }
  // Update device status indicator
});

// Listen for alert updates
socket.on('alert:acknowledged', (alert) => { });
socket.on('alert:resolved', (alert) => { });

// Listen for any dashboard change
socket.on('dashboard:update', () => {
  // Refresh dashboard summary cards
});
```

---

## Alert Types — Quick Reference for Notifications

| Alert Type | Push Notification Message |
|-----------|--------------------------|
| `temperature_high` | "⚠️ CS001 — Temperature too HIGH (15.8°C > 8°C max)" |
| `temperature_low` | "⚠️ CS001 — Temperature too LOW (0.5°C < 2°C min)" |
| `humidity_high` | "⚠️ CS001 — Humidity too HIGH (97% > 95% max)" |
| `humidity_low` | "⚠️ CS001 — Humidity too LOW (80% < 85% min)" |
| `door_open` | "🚨 CS001 — Door left OPEN for 7 minutes!" |
| `device_offline` | "🔴 CS001 — Device OFFLINE (no data for 15 min)" |

---

## Data Stored Locally on Device

| Data | Storage Method | When to clear |
|------|---------------|---------------|
| Access Token (JWT) | Secure Storage | On logout |
| Refresh Token | Secure Storage | On logout |
| User Profile | Secure Storage | On logout |
| Last Dashboard Data | Regular Storage | On logout or 5 min stale |
| Alert notification preferences | Regular Storage | Never (user preference) |
| App theme setting | Regular Storage | Never (user preference) |

---

## Security Notes for Mobile App

1. **Always store tokens in Secure Storage** (not regular local storage)
2. **Access token expires in 15 minutes** — app must auto-refresh using refresh token
3. **Refresh token expires in 7 days** — user must re-login after that
4. **Never store password on device** — only store tokens
5. **Certificate pinning** recommended for production to prevent MITM attacks
6. **Auto-logout** after inactivity (configurable in settings)

---

## Project File Structure (Suggested)

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.jsx
│   │   │   ├── LoginScreen.jsx
│   │   │   └── ForgotPasswordScreen.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.jsx
│   │   │   └── TemperatureChartScreen.jsx
│   │   ├── devices/
│   │   │   ├── DeviceListScreen.jsx
│   │   │   ├── DeviceDetailScreen.jsx
│   │   │   ├── DeviceFormScreen.jsx
│   │   │   ├── SensorHistoryScreen.jsx
│   │   │   └── DeviceStatsScreen.jsx
│   │   ├── alerts/
│   │   │   ├── AlertListScreen.jsx
│   │   │   └── AlertDetailScreen.jsx
│   │   ├── vegetables/
│   │   │   ├── VegetableListScreen.jsx
│   │   │   ├── VegetableDetailScreen.jsx
│   │   │   └── VegetableFormScreen.jsx
│   │   ├── users/
│   │   │   ├── UserListScreen.jsx
│   │   │   ├── UserDetailScreen.jsx
│   │   │   ├── UserFormScreen.jsx
│   │   │   └── AssignDevicesScreen.jsx
│   │   ├── sensors/
│   │   │   └── ManualReadingScreen.jsx
│   │   └── profile/
│   │       ├── ProfileScreen.jsx
│   │       ├── ChangePasswordScreen.jsx
│   │       ├── NotificationSettingsScreen.jsx
│   │       └── AppSettingsScreen.jsx
│   ├── api/
│   │   ├── client.js          (axios instance with token refresh logic)
│   │   ├── auth.api.js
│   │   ├── devices.api.js
│   │   ├── sensors.api.js
│   │   ├── alerts.api.js
│   │   ├── vegetables.api.js
│   │   ├── users.api.js
│   │   └── dashboard.api.js
│   ├── socket/
│   │   └── socket.js          (Socket.IO connection + event handlers)
│   ├── store/
│   │   ├── authStore.js       (user, tokens)
│   │   ├── deviceStore.js     (devices list, selected device)
│   │   └── alertStore.js      (alerts, unread count)
│   ├── navigation/
│   │   ├── AppNavigator.jsx   (root — auth vs main app)
│   │   ├── AuthNavigator.jsx  (login stack)
│   │   └── MainNavigator.jsx  (bottom tabs + stacks)
│   ├── components/
│   │   ├── DeviceCard.jsx
│   │   ├── AlertCard.jsx
│   │   ├── SensorGauge.jsx    (temperature/humidity gauge)
│   │   ├── StatusBadge.jsx
│   │   └── EmptyState.jsx
│   └── utils/
│       ├── tokenStorage.js    (secure read/write for JWT)
│       ├── roleHelper.js      (check permissions for UI)
│       └── formatters.js      (date, temp, humidity format)
├── package.json
└── README.md
```

---

## Backend Server Details

| Item | Value |
|------|-------|
| Base URL | `http://your-server-ip:5000` |
| API Version | `/api/v1` |
| Socket.IO | `http://your-server-ip:5000` |
| Health Check | `GET http://your-server-ip:5000/health` |
| API Docs (Swagger) | `GET http://your-server-ip:5000/api-docs` |
| Dev Server Port | `5000` |
| Database | MongoDB |
| Access Token Lifetime | 15 minutes |
| Refresh Token Lifetime | 7 days |
| Sensor Data Retention | 90 days (auto-deleted) |
| Audit Log Retention | 1 year (auto-deleted) |

---

*This document covers all 24 screens, all 4 user roles, all 7 API modules, and all real-time features for the Cold Storage Monitoring mobile application.*
