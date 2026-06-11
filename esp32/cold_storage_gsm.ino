/*
 * Cold Storage Monitor — ESP32 + SIM800L (Airtel GSM)
 *
 * Sensors : DHT22  (temperature + humidity)
 *           Reed switch (door open/closed)
 * Network : SIM800L via UART2, Airtel GPRS
 * Backend : Node.js REST API at SERVER_HOST:SERVER_PORT
 *
 * Libraries required (install via Arduino Library Manager):
 *   - DHT sensor library  by Adafruit
 *   - ArduinoJson         by Benoit Blanchon  (v6.x)
 *
 * Wiring:
 *   SIM800L TX  →  ESP32 GPIO 16 (RX2)
 *   SIM800L RX  →  ESP32 GPIO 17 (TX2)
 *   SIM800L RST →  ESP32 GPIO 5
 *   SIM800L VCC →  4.0 V (use dedicated supply; NOT 3.3 V)
 *   SIM800L GND →  GND
 *
 *   DHT22 DATA  →  ESP32 GPIO 4  (with 10 kΩ pull-up to 3.3 V)
 *   Reed switch →  ESP32 GPIO 14 (other leg to GND; uses internal pull-up)
 *                  LOW  = door OPEN  (magnet away from switch)
 *                  HIGH = door CLOSED
 */

#include <Arduino.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ─── Pin Definitions ──────────────────────────────────────────────────────
#define GSM_RX_PIN       16   // ESP32 RX2  ← SIM800L TX
#define GSM_TX_PIN       17   // ESP32 TX2  → SIM800L RX
#define GSM_RST_PIN       5   // SIM800L RST (active LOW pulse)
#define DHT_PIN           4   // DHT22 data
#define DOOR_PIN         14   // Reed switch  (LOW = open, HIGH = closed)
#define COMPRESSOR_PIN   13   // Compressor feedback  (HIGH = running)
                              // Wire to relay feedback / current sensor output
#define DHT_TYPE     DHT22

// ─── VOC Sensor ──────────────────────────────────────────────────────────
// Uncomment the library that matches your hardware:
//   SGP40  →  #include <Adafruit_SGP40.h>   Adafruit_SGP40 sgp;
//   SGP30  →  #include <Adafruit_SGP30.h>   Adafruit_SGP30 sgp;
// Leave both commented-out if no VOC sensor is fitted — reads as 0.
//
// #include <Adafruit_SGP40.h>
// Adafruit_SGP40 sgp;

// ─── Backend Settings  (EDIT THESE) ──────────────────────────────────────
#define SERVER_HOST  "YOUR_SERVER_IP_OR_DOMAIN"   // e.g. "192.168.1.100" or "api.yourapp.com"
#define SERVER_PORT  5000
#define API_BASE     "/api/v1"

// Device credentials — must match what is registered in the backend
#define DEVICE_ID    "DEVICE001"
#define LOGIN_EMAIL  "operator@coldstorage.com"
#define LOGIN_PASS   "YourPassword"

// ─── Airtel GPRS Settings ─────────────────────────────────────────────────
// Common Airtel APNs:
//   prepaid data  →  "airtelgprs.com"
//   postpaid/4G   →  "airtelnxt.net"   or  "airtel.in"
#define APN          "airtelgprs.com"

// ─── Timing ───────────────────────────────────────────────────────────────
#define SEND_INTERVAL_MS   30000UL    // sensor push interval (30 s)
#define TOKEN_LIFETIME_MS  3300000UL  // re-login before 1-hour token expires (55 min)
#define HTTP_TIMEOUT_MS    15000UL    // max wait for HTTP response

// ─── Globals ──────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial gsmSerial(2);  // UART2

char g_accessToken[600] = "";
unsigned long g_lastSendMs  = 0;
unsigned long g_lastLoginMs = 0;
bool g_gprsUp = false;

// ─── Low-level AT helpers ─────────────────────────────────────────────────

// Flush any pending bytes from the modem
void gsmFlush() {
  delay(50);
  while (gsmSerial.available()) gsmSerial.read();
}

// Send an AT command; return true if 'expected' appears in the reply within 'timeout' ms.
bool sendAT(const char* cmd, const char* expected, uint32_t timeout = 3000) {
  gsmFlush();
  gsmSerial.println(cmd);
  unsigned long t0 = millis();
  String buf = "";
  while (millis() - t0 < timeout) {
    while (gsmSerial.available()) buf += (char)gsmSerial.read();
    if (buf.indexOf(expected) != -1) return true;
    if (buf.indexOf("ERROR") != -1)  return false;
  }
  return false;
}

// Send an AT command and collect the full response.
String sendATRead(const char* cmd, uint32_t timeout = 5000) {
  gsmFlush();
  gsmSerial.println(cmd);
  unsigned long t0 = millis();
  String buf = "";
  while (millis() - t0 < timeout) {
    while (gsmSerial.available()) buf += (char)gsmSerial.read();
  }
  return buf;
}

// ─── Modem Init ───────────────────────────────────────────────────────────

bool waitModemReady(uint32_t maxMs = 20000) {
  unsigned long t0 = millis();
  while (millis() - t0 < maxMs) {
    if (sendAT("AT", "OK", 1000)) return true;
    delay(500);
  }
  return false;
}

void resetModem() {
  Serial.println(F("[GSM] Hard-reset modem"));
  pinMode(GSM_RST_PIN, OUTPUT);
  digitalWrite(GSM_RST_PIN, LOW);
  delay(300);
  digitalWrite(GSM_RST_PIN, HIGH);
  delay(4000);  // wait for modem boot
}

// ─── GPRS Bearer ─────────────────────────────────────────────────────────

bool connectGPRS() {
  sendAT("AT+SAPBR=0,1", "OK", 4000);  // close any stale bearer
  delay(1000);

  sendAT("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK");

  char cmd[80];
  snprintf(cmd, sizeof(cmd), "AT+SAPBR=3,1,\"APN\",\"%s\"", APN);
  sendAT(cmd, "OK");

  sendAT("AT+SAPBR=3,1,\"USER\",\"\"", "OK");
  sendAT("AT+SAPBR=3,1,\"PWD\",\"\"",  "OK");

  if (!sendAT("AT+SAPBR=1,1", "OK", 12000)) return false;
  delay(2000);

  String ip = sendATRead("AT+SAPBR=2,1", 3000);
  Serial.print(F("[GSM] IP: ")); Serial.println(ip);
  return (ip.indexOf("0.0.0.0") == -1);
}

// ─── GSM Network Clock → ISO 8601 ────────────────────────────────────────

String getTimestamp() {
  String raw = sendATRead("AT+CCLK?", 2000);
  // Example:  +CCLK: "26/06/08,10:45:30+22"
  int s = raw.indexOf('"');
  if (s == -1) return "";
  int e = raw.indexOf('"', s + 1);
  if (e == -1) return "";
  String dt = raw.substring(s + 1, e);  // "26/06/08,10:45:30+22"

  int yr, mo, da, hh, mm, ss;
  if (sscanf(dt.c_str(), "%d/%d/%d,%d:%d:%d", &yr, &mo, &da, &hh, &mm, &ss) == 6) {
    char iso[28];
    snprintf(iso, sizeof(iso), "20%02d-%02d-%02dT%02d:%02d:%02d.000Z",
             yr, mo, da, hh, mm, ss);
    return String(iso);
  }
  return "";
}

// ─── HTTP POST via SIM800L AT commands ───────────────────────────────────
//
// Returns the raw response body string, or "" on failure.

String httpPost(const char* path, const char* jsonBody, const char* bearerToken = nullptr) {
  // Full URL
  char url[256];
  snprintf(url, sizeof(url), "http://%s:%d%s%s", SERVER_HOST, SERVER_PORT, API_BASE, path);

  // --- Initialize HTTP stack
  if (!sendAT("AT+HTTPINIT", "OK", 4000)) {
    Serial.println(F("[HTTP] HTTPINIT failed"));
    return "";
  }

  sendAT("AT+HTTPPARA=\"CID\",1", "OK");

  char urlCmd[280];
  snprintf(urlCmd, sizeof(urlCmd), "AT+HTTPPARA=\"URL\",\"%s\"", url);
  if (!sendAT(urlCmd, "OK")) {
    sendAT("AT+HTTPTERM", "OK", 2000);
    return "";
  }

  sendAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK");

  // Bearer token header (USERDATA supports custom HTTP headers in SIM800L)
  if (bearerToken && strlen(bearerToken) > 0) {
    char authCmd[700];
    snprintf(authCmd, sizeof(authCmd),
             "AT+HTTPPARA=\"USERDATA\",\"Authorization: Bearer %s\\r\\n\"", bearerToken);
    sendAT(authCmd, "OK");
  }

  // --- Send body
  int bodyLen = strlen(jsonBody);
  char dataCmd[32];
  snprintf(dataCmd, sizeof(dataCmd), "AT+HTTPDATA=%d,10000", bodyLen);

  if (!sendAT(dataCmd, "DOWNLOAD", 5000)) {
    sendAT("AT+HTTPTERM", "OK", 2000);
    return "";
  }
  gsmSerial.print(jsonBody);
  delay(bodyLen < 300 ? 800 : 1500);

  // --- Trigger POST (action=1)
  String actionResp = sendATRead("AT+HTTPACTION=1", HTTP_TIMEOUT_MS);
  if (actionResp.indexOf("+HTTPACTION") == -1) {
    Serial.println(F("[HTTP] No HTTPACTION response"));
    sendAT("AT+HTTPTERM", "OK", 2000);
    return "";
  }

  // Check HTTP status code embedded in +HTTPACTION: 1,<status>,<len>
  // e.g.  +HTTPACTION: 1,200,125   or  +HTTPACTION: 1,401,60
  if (actionResp.indexOf(",401,") != -1) {
    Serial.println(F("[HTTP] 401 Unauthorized"));
    sendAT("AT+HTTPTERM", "OK", 2000);
    return "401";
  }
  if (actionResp.indexOf(",4") != -1 || actionResp.indexOf(",5") != -1) {
    // 4xx / 5xx errors — still read body for debug
    Serial.println(F("[HTTP] 4xx/5xx error"));
  }

  // --- Read response body
  String body = sendATRead("AT+HTTPREAD", 6000);

  sendAT("AT+HTTPTERM", "OK", 2000);
  return body;
}

// ─── Login ────────────────────────────────────────────────────────────────

bool doLogin() {
  Serial.println(F("[AUTH] Logging in..."));

  char body[256];
  snprintf(body, sizeof(body),
           "{\"email\":\"%s\",\"password\":\"%s\"}",
           LOGIN_EMAIL, LOGIN_PASS);

  String resp = httpPost("/auth/login", body);
  if (resp.length() == 0) {
    Serial.println(F("[AUTH] No response from login endpoint"));
    return false;
  }

  // Find the JSON object in the response (skip AT echo lines)
  int start = resp.indexOf('{');
  if (start == -1) {
    Serial.println(F("[AUTH] No JSON in response"));
    return false;
  }
  String json = resp.substring(start);

  StaticJsonDocument<1536> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    Serial.print(F("[AUTH] JSON parse error: ")); Serial.println(err.c_str());
    return false;
  }

  // Response shape:  { success: true, data: { accessToken: "...", user: {...} } }
  const char* token = doc["data"]["accessToken"] | doc["data"]["tokens"]["accessToken"];
  if (!token) {
    Serial.println(F("[AUTH] accessToken not found in response"));
    Serial.println(json.substring(0, 300));
    return false;
  }

  strncpy(g_accessToken, token, sizeof(g_accessToken) - 1);
  g_lastLoginMs = millis();
  Serial.println(F("[AUTH] Login OK — token cached"));
  return true;
}

// ─── Send Sensor Reading ─────────────────────────────────────────────────
//
//  Payload fields:
//    temp       – float   (°C, from DHT22)
//    hum        – float   (%, from DHT22)
//    voc        – int32   (VOC index, e.g. SGP40: 1-500; 0 if sensor absent)
//    compressor – bool    (true = compressor relay ON)
//    door       – bool    (true = door OPEN)

bool sendReading(float temp, float hum, int32_t voc, bool compressor, bool doorOpen) {
  char body[400];
  String ts = getTimestamp();

  if (ts.length() > 0) {
    snprintf(body, sizeof(body),
      "{\"deviceId\":\"%s\",\"temp\":%.1f,\"hum\":%.1f,"
      "\"voc\":%d,\"compressor\":%s,\"door\":%s,\"timestamp\":\"%s\"}",
      DEVICE_ID, temp, hum, voc,
      compressor ? "true" : "false",
      doorOpen   ? "true" : "false",
      ts.c_str());
  } else {
    snprintf(body, sizeof(body),
      "{\"deviceId\":\"%s\",\"temp\":%.1f,\"hum\":%.1f,"
      "\"voc\":%d,\"compressor\":%s,\"door\":%s}",
      DEVICE_ID, temp, hum, voc,
      compressor ? "true" : "false",
      doorOpen   ? "true" : "false");
  }

  Serial.print(F("[TX] ")); Serial.println(body);

  String resp = httpPost("/sensors", body, g_accessToken);

  if (resp == "401") {
    Serial.println(F("[TX] Token expired — re-login and retry"));
    if (doLogin()) resp = httpPost("/sensors", body, g_accessToken);
    else return false;
  }

  if (resp.length() == 0) {
    Serial.println(F("[TX] Send failed"));
    return false;
  }

  // Quick success check (status 201)
  bool ok = (resp.indexOf(",201,") != -1) || (resp.indexOf("\"success\":true") != -1);
  Serial.println(ok ? F("[TX] Sent OK") : F("[TX] Unexpected response"));
  if (!ok) Serial.println(resp.substring(0, 300));
  return ok;
}

// ─── setup ────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  Serial.println(F("\n=== Cold Storage Monitor (ESP32 + SIM800L) ==="));

  pinMode(DOOR_PIN,       INPUT_PULLUP);
  pinMode(COMPRESSOR_PIN, INPUT);   // or INPUT_PULLDOWN depending on your circuit
  dht.begin();

  // sgp.begin();  // uncomment if VOC sensor is fitted

  gsmSerial.begin(9600, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);

  resetModem();

  if (!waitModemReady()) {
    Serial.println(F("[ERROR] GSM modem not responding — check wiring/power"));
    return;
  }
  Serial.println(F("[GSM] Modem ready"));

  sendAT("ATE0", "OK");                  // disable echo
  sendAT("AT+CMEE=1", "OK");             // verbose error codes

  // Wait for SIM to be ready
  for (int i = 0; i < 20; i++) {
    if (sendAT("AT+CPIN?", "READY", 2000)) break;
    Serial.println(F("[SIM] Waiting for SIM..."));
    delay(1000);
  }

  // Wait for network registration
  Serial.print(F("[GSM] Waiting for network"));
  bool registered = false;
  for (int i = 0; i < 60; i++) {
    String r = sendATRead("AT+CREG?", 2000);
    if (r.indexOf(",1") != -1 || r.indexOf(",5") != -1) {
      registered = true;
      break;
    }
    Serial.print('.');
    delay(1000);
  }
  Serial.println();
  if (!registered) {
    Serial.println(F("[ERROR] Network registration failed — check SIM / signal"));
    return;
  }
  Serial.println(F("[GSM] Network registered (Airtel)"));

  // Print signal quality
  Serial.println(sendATRead("AT+CSQ", 2000));

  // Enable network time sync
  sendAT("AT+CLTS=1", "OK");
  sendAT("AT&W",      "OK");

  // Connect GPRS
  Serial.println(F("[GPRS] Connecting..."));
  for (int attempt = 1; attempt <= 5; attempt++) {
    if (connectGPRS()) {
      g_gprsUp = true;
      Serial.println(F("[GPRS] Connected"));
      break;
    }
    Serial.printf("[GPRS] Attempt %d/5 failed\n", attempt);
    delay(4000);
  }

  if (!g_gprsUp) {
    Serial.println(F("[ERROR] GPRS connection failed"));
    return;
  }

  // Login
  for (int attempt = 1; attempt <= 3; attempt++) {
    if (doLogin()) break;
    Serial.printf("[AUTH] Attempt %d/3 failed, retrying in 5 s\n", attempt);
    delay(5000);
  }
}

// ─── loop ─────────────────────────────────────────────────────────────────

void loop() {
  if (!g_gprsUp) {
    // Try to recover GPRS every minute
    delay(60000);
    g_gprsUp = connectGPRS();
    return;
  }

  unsigned long now = millis();

  // Proactive token refresh before expiry
  if (strlen(g_accessToken) > 0 && (now - g_lastLoginMs) > TOKEN_LIFETIME_MS) {
    doLogin();
  }

  if (now - g_lastSendMs >= SEND_INTERVAL_MS) {
    g_lastSendMs = now;

    float temp = dht.readTemperature();   // Celsius
    float hum  = dht.readHumidity();      // %RH

    if (isnan(temp) || isnan(hum)) {
      Serial.println(F("[DHT] Sensor read failed — check wiring"));
      return;
    }

    // Reed switch: LOW = door OPEN (magnet removed from switch)
    bool doorOpen  = (digitalRead(DOOR_PIN)       == LOW);
    bool compOn    = (digitalRead(COMPRESSOR_PIN)  == HIGH);

    // VOC index — replace with your sensor read call if fitted:
    //   int32_t voc = sgp.measureVocIndex(temp, hum);
    int32_t voc = 0;

    Serial.printf("[SENSOR] Temp=%.1f°C  Hum=%.1f%%  VOC=%d  Comp=%s  Door=%s\n",
                  temp, hum, voc, compOn ? "ON" : "OFF", doorOpen ? "OPEN" : "CLOSED");

    if (strlen(g_accessToken) == 0) doLogin();

    sendReading(temp, hum, voc, compOn, doorOpen);
  }
}
