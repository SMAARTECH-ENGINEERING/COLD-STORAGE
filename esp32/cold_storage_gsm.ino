#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>
#include "Adafruit_SGP40.h"

// -- GSM / HTTP ---------------------------------------------------------------
#define TINY_GSM_MODEM_SIM7600
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include <SSLClient.h>
#ifdef U8X8_HAVE_HW_SPI
#include <SPI.h>
#endif

// ============================================================================
// USER CONFIG — edit before flashing
// ============================================================================

// Airtel GPRS
const char APN[]      = "airtelgprs.com";
const char APN_USER[] = "";
const char APN_PASS[] = "";

// Render free-tier URL  (no https:// prefix — TinyGSM adds that via port 443)
const char SERVER_HOST[] = "cold-storage-2.onrender.com";
const int  SERVER_PORT   = 443;

// Must match a deviceId registered in the backend DB
const char DEVICE_ID[] = "CS001";

// Operator account created in backend (role: operator)
const char IOT_EMAIL[]    = "operator@coldstorage.com";
const char IOT_PASSWORD[] = "Operator@1234";

// ============================================================================
// PIN ASSIGNMENTS (ESP32)
//   I2C (SDA=21, SCL=22) shared by SGP40 and OLED
// ============================================================================
#define PIN_GSM_TX      17    // ESP32 TXD2  →  SIM7600 RXD
#define PIN_GSM_RX      16    // ESP32 RXD2  ←  SIM7600 TXD
#define PIN_GSM_PWR      4    // SIM7600 PWRKEY

#define PIN_DOOR        34    // Reed switch  INPUT_PULLUP  HIGH=open
#define PIN_COMPRESSOR  35    // Compressor sense           HIGH=running
#define PIN_TEMP_ADC    36    // NTC thermistor ADC (VP pin, 12-bit)
#define PIN_LED          2    // Onboard LED

// ============================================================================
// NTC THERMISTOR  (10 kΩ, B=3950, pull-up to 3.3 V via 10 kΩ)
//   Remove this block and set g_temp manually if you use a digital T sensor.
// ============================================================================
#define NTC_NOMINAL_R   10000.0f   // Resistance at 25 °C
#define NTC_BCOEFF      3950.0f    // Beta coefficient
#define NTC_SERIES_R    10000.0f   // Series resistor value
#define NTC_NOMINAL_T   298.15f    // 25 °C in Kelvin
#define ADC_MAX         4095.0f    // ESP32 12-bit ADC

// Cold-storage typical humidity used as SGP40 compensation default.
// Replace with actual sensor reading when a humidity sensor is wired.
#define HUMIDITY_DEFAULT  85.0f

// ============================================================================
// TIMING
// ============================================================================
#define SENSOR_POST_MS       30000UL           // POST every 30 s
#define TOKEN_REFRESH_MS     (13UL * 60 * 1000) // Refresh at 13 min (server expires at 15 min)
#define GSM_WAIT_TIMEOUT_MS  60000UL
#define HTTP_TIMEOUT_MS      90000  // Render free tier cold-start can take ~50-80 s

// ============================================================================
// GLOBAL STATE
// ============================================================================
char     g_accessToken[512]  = "";
char     g_refreshToken[512] = "";
uint32_t g_tokenAt           = 0;

float    g_temp       = 0.0f;
float    g_humidity   = HUMIDITY_DEFAULT;
int32_t  g_vocIndex   = 0;
bool     g_doorOpen   = false;
bool     g_compressor = false;
bool     g_netOK      = false;

uint32_t g_lastPost   = 0;
uint32_t g_lastRender = 0;

// ============================================================================
// OBJECTS
// ============================================================================
HardwareSerial gsmSerial(2);
TinyGsm        modem(gsmSerial);

TinyGsmClient  gsmTransport(modem);   // raw TCP over the modem
SSLClient      gsmClient(&gsmTransport);  // TLS done on the ESP32

HttpClient     http(gsmClient, SERVER_HOST, SERVER_PORT);

Adafruit_SGP40 sgp40;

// SSD1306 128×64 I2C — change constructor if your panel differs
U8G2_SSD1306_128X64_NONAME_F_HW_I2C oled(U8G2_R0, U8X8_PIN_NONE);

// ============================================================================
// FORWARD DECLARATIONS
// ============================================================================
bool   gsmConnect();
bool   jwtLogin();
bool   jwtRefresh();
bool   ensureToken();
bool   postReading();
void   readSensors();
float  readNTC();
void   renderOLED();
void   oledMsg(const char* l1, const char* l2 = "");
void   blinkLED(uint8_t n, uint16_t ms = 150);

// ============================================================================
// SETUP
// ============================================================================
void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println(F("\n[BOOT] Cold Storage IoT Node v1.0"));

    pinMode(PIN_DOOR,       INPUT_PULLUP);
    pinMode(PIN_COMPRESSOR, INPUT);
    pinMode(PIN_LED,        OUTPUT);
    analogReadResolution(12);   // ESP32 12-bit ADC
    digitalWrite(PIN_LED, LOW);

    Wire.begin(21, 22);

    // ---- OLED ---------------------------------------------------------------
    oled.begin();
    oledMsg("Cold Storage IoT", "Initializing...");

    // ---- SGP40 VOC ----------------------------------------------------------
    if (!sgp40.begin()) {
        Serial.println(F("[ERR] SGP40 not found — check I2C wiring (SDA=21 SCL=22)"));
        oledMsg("SGP40 ERROR", "Check I2C wiring");
        delay(3000);
    } else {
        Serial.printf("[OK]  SGP40  SN=0x%04X%04X%04X\n",
            sgp40.serialnumber[0], sgp40.serialnumber[1], sgp40.serialnumber[2]);
    }

    // ---- SIM7600 GSM --------------------------------------------------------
    gsmSerial.begin(115200, SERIAL_8N1, PIN_GSM_RX, PIN_GSM_TX);
    delay(1000);

    oledMsg("GSM Modem", "Restarting...");
    Serial.println(F("[GSM] Modem restart"));
    modem.restart();
    delay(8000);   // SIM7600 cold-start needs ~8 s

    Serial.print(F("[GSM] Model: "));  Serial.println(modem.getModemInfo());
    Serial.print(F("[GSM] IMEI:  "));  Serial.println(modem.getIMEI());
    Serial.print(F("[GSM] SIM:   "));  Serial.println(modem.getSimStatus());

    // ---- GPRS connect (5 attempts) ------------------------------------------
    oledMsg("Airtel GPRS", "Connecting...");
    for (uint8_t i = 1; i <= 5; i++) {
        if (gsmConnect()) break;
        Serial.printf("[GSM] Attempt %u/5 failed — wait 15 s\n", i);
        oledMsg("GPRS failed", "Retrying...");
        delay(15000);
        if (i == 5) { Serial.println(F("[GSM] Giving up — reboot")); ESP.restart(); }
    }

    // ---- JWT login (3 attempts) ---------------------------------------------
    oledMsg("Backend", "Authenticating...");
    for (uint8_t i = 1; i <= 3; i++) {
        if (jwtLogin()) break;
        Serial.printf("[AUTH] Attempt %u/3 failed — wait 30 s\n", i);
        delay(30000);
        if (i == 3) { Serial.println(F("[AUTH] Giving up — reboot")); ESP.restart(); }
    }

    readSensors();
    renderOLED();
    blinkLED(3);
    Serial.println(F("[BOOT] System ready\n"));
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
    uint32_t now = millis();

    // ---- JWT token refresh --------------------------------------------------
    if (strlen(g_accessToken) > 0 && (now - g_tokenAt) >= TOKEN_REFRESH_MS) {
        Serial.println(F("[AUTH] Token refresh due"));
        if (!jwtRefresh()) {
            Serial.println(F("[AUTH] Refresh failed — re-login"));
            jwtLogin();
        }
    }

    // ---- GPRS watchdog ------------------------------------------------------
    if (!modem.isGprsConnected()) {
        Serial.println(F("[GSM] GPRS lost — reconnecting"));
        g_netOK = false;
        gsmConnect();
    }

    // ---- Periodic sensor post -----------------------------------------------
    if ((now - g_lastPost) >= SENSOR_POST_MS) {
        g_lastPost = now;
        readSensors();
        ensureToken();
        g_netOK = postReading();
        blinkLED(g_netOK ? 1 : 3, g_netOK ? 150 : 80);
    }

    // ---- OLED refresh every 5 s ---------------------------------------------
    if ((now - g_lastRender) >= 5000UL) {
        g_lastRender = now;
        renderOLED();
    }

    delay(50);
}

// ============================================================================
// GSM / GPRS
// ============================================================================
bool gsmConnect() {
    Serial.print(F("[GSM] Waiting for network..."));
    if (!modem.waitForNetwork(GSM_WAIT_TIMEOUT_MS)) {
        Serial.println(F(" TIMEOUT"));
        return false;
    }
    Serial.printf(" OK  RSSI=%d dBm\n", modem.getSignalQuality());

    Serial.printf("[GSM] APN '%s'...", APN);
    if (!modem.gprsConnect(APN, APN_USER, APN_PASS)) {
        Serial.println(F(" FAILED"));
        return false;
    }
    Serial.print(F(" OK  IP="));
    Serial.println(modem.localIP());
    return true;
}

// ============================================================================
// JWT LOGIN  →  POST /api/v1/auth/login
// ============================================================================
bool jwtLogin() {
    Serial.println(F("[AUTH] POST /api/v1/auth/login"));

    StaticJsonDocument<192> req;
    req["email"]    = IOT_EMAIL;
    req["password"] = IOT_PASSWORD;
    char reqBody[192];
    serializeJson(req, reqBody, sizeof(reqBody));

    http.setTimeout(HTTP_TIMEOUT_MS);
    http.beginRequest();
    http.post("/api/v1/auth/login");
    http.sendHeader("Content-Type", "application/json");
    http.sendHeader("Content-Length", (int)strlen(reqBody));
    http.beginBody();
    http.print(reqBody);
    http.endRequest();

    int    code = http.responseStatusCode();
    String body = http.responseBody();
    Serial.printf("[AUTH] Login → HTTP %d\n", code);
    if (code != 200) return false;

    // Two JWTs + user object in response — 2048 bytes covers it
    DynamicJsonDocument resp(2048);
    if (deserializeJson(resp, body) != DeserializationError::Ok) {
        Serial.println(F("[AUTH] JSON parse error"));
        return false;
    }
    if (!resp["success"].as<bool>()) return false;

    const char* at = resp["data"]["accessToken"];
    const char* rt = resp["data"]["refreshToken"];
    if (!at || !rt) return false;

    strlcpy(g_accessToken,  at, sizeof(g_accessToken));
    strlcpy(g_refreshToken, rt, sizeof(g_refreshToken));
    g_tokenAt = millis();

    Serial.println(F("[AUTH] Login OK — token valid 15 min"));
    return true;
}

// ============================================================================
// JWT REFRESH  →  POST /api/v1/auth/refresh-token
// ============================================================================
bool jwtRefresh() {
    if (strlen(g_refreshToken) == 0) return false;
    Serial.println(F("[AUTH] POST /api/v1/auth/refresh-token"));

    StaticJsonDocument<512> req;
    req["refreshToken"] = g_refreshToken;
    char reqBody[512];
    serializeJson(req, reqBody, sizeof(reqBody));

    http.setTimeout(HTTP_TIMEOUT_MS);
    http.beginRequest();
    http.post("/api/v1/auth/refresh-token");
    http.sendHeader("Content-Type", "application/json");
    http.sendHeader("Content-Length", (int)strlen(reqBody));
    http.beginBody();
    http.print(reqBody);
    http.endRequest();

    int    code = http.responseStatusCode();
    String body = http.responseBody();
    if (code != 200) return false;

    DynamicJsonDocument resp(1536);
    if (deserializeJson(resp, body) != DeserializationError::Ok) return false;
    if (!resp["success"].as<bool>()) return false;

    const char* at = resp["data"]["accessToken"];
    if (!at) return false;
    strlcpy(g_accessToken, at, sizeof(g_accessToken));
    g_tokenAt = millis();

    // Server may issue a rotated refresh token
    const char* rt = resp["data"]["refreshToken"];
    if (rt) strlcpy(g_refreshToken, rt, sizeof(g_refreshToken));

    Serial.println(F("[AUTH] Refresh OK"));
    return true;
}

bool ensureToken() {
    if (strlen(g_accessToken) > 0) return true;
    return jwtLogin();
}

// ============================================================================
// NTC THERMISTOR TEMPERATURE READ (GPIO36 / ADC)
//   Steinhart-Hart simplified (B-parameter equation)
//   Wiring: 3.3V → 10kΩ resistor → GPIO36 → 10kΩ NTC → GND
// ============================================================================
float readNTC() {
    // Average 8 samples for noise rejection
    uint32_t raw = 0;
    for (uint8_t i = 0; i < 8; i++) { raw += analogRead(PIN_TEMP_ADC); delay(2); }
    float adcVal = raw / 8.0f;

    if (adcVal <= 0 || adcVal >= ADC_MAX) return g_temp;  // open/short circuit guard

    float resistance = NTC_SERIES_R * (ADC_MAX / adcVal - 1.0f);
    float steinhart  = log(resistance / NTC_NOMINAL_R) / NTC_BCOEFF;
    steinhart       += 1.0f / NTC_NOMINAL_T;
    return (1.0f / steinhart) - 273.15f;   // Kelvin → °C
}

// ============================================================================
// SENSOR READING
// ============================================================================
void readSensors() {
    // Temperature via NTC (no external library needed)
    float t = readNTC();
    if (t > -40.0f && t < 85.0f) g_temp = t;   // sanity range

    // Humidity: fixed cold-storage default (wire SHT31/DHT22 here when available)
    g_humidity = HUMIDITY_DEFAULT;

    // SGP40 VOC index 0–500  (100 = clean air baseline)
    g_vocIndex = sgp40.measureVocIndex(g_temp, g_humidity);

    // Reed switch: INPUT_PULLUP — HIGH = door open (magnet away)
    g_doorOpen   = (digitalRead(PIN_DOOR) == HIGH);

    // Compressor sense line
    g_compressor = (digitalRead(PIN_COMPRESSOR) == HIGH);

    Serial.printf("[SENSOR] T=%.2f°C  H=%.0f%%  VOC=%d  Door=%s  Comp=%s\n",
        g_temp, g_humidity, g_vocIndex,
        g_doorOpen   ? "OPEN"   : "CLOSED",
        g_compressor ? "ON"     : "OFF");
}

// ============================================================================
// POST SENSOR DATA  →  POST /api/v1/sensors
//   Field names match backend flexible ingest (camelCase accepted)
// ============================================================================
bool postReading() {
    if (strlen(g_accessToken) == 0) return false;

    StaticJsonDocument<256> payload;
    payload["deviceId"]   = DEVICE_ID;
    payload["temp"]       = g_temp;       // °C
    payload["hum"]        = g_humidity;   // %RH
    payload["door"]       = g_doorOpen;   // true = open
    payload["voc"]        = g_vocIndex;   // 0–500
    payload["compressor"] = g_compressor; // true = running

    char body[256];
    serializeJson(payload, body, sizeof(body));

    // "Bearer <token>" — token up to 511 chars + 7 prefix + null
    char authHdr[520];
    snprintf(authHdr, sizeof(authHdr), "Bearer %s", g_accessToken);

    http.setTimeout(HTTP_TIMEOUT_MS);
    http.beginRequest();
    http.post("/api/v1/sensors");
    http.sendHeader("Content-Type",  "application/json");
    http.sendHeader("Content-Length", (int)strlen(body));
    http.sendHeader("Authorization",  authHdr);
    http.beginBody();
    http.print(body);
    http.endRequest();

    int code = http.responseStatusCode();
    http.responseBody();  // flush — prevents stale data on next request

    Serial.printf("[HTTP] POST /api/v1/sensors → %d\n", code);

    if (code == 401) {
        // Token expired mid-cycle — clear forces re-login on next iteration
        memset(g_accessToken, 0, sizeof(g_accessToken));
        return false;
    }
    return (code == 200 || code == 201);
}

// ============================================================================
// OLED DISPLAY  128×64  font u8g2_font_6x10_tf → ~21 chars/row
// ============================================================================
void renderOLED() {
    char r1[22], r2[22], r3[22], ft[22];

    snprintf(r1, sizeof(r1), "Temp:%.1fC  Hum:%.0f%%", g_temp, g_humidity);
    snprintf(r2, sizeof(r2), "VOC:%-5d Door:%-4s",
             g_vocIndex, g_doorOpen ? "OPEN" : "CLSD");
    snprintf(r3, sizeof(r3), "Comp:%-3s  Net:%-3s",
             g_compressor ? "ON"  : "OFF",
             g_netOK      ? "OK"  : "ERR");
    snprintf(ft, sizeof(ft), "%-11s RSSI:%d",
             DEVICE_ID, modem.getSignalQuality());

    oled.clearBuffer();
    oled.setFont(u8g2_font_6x10_tf);

    oled.drawStr(0, 10,  "= COLD STORAGE IoT =");
    oled.drawHLine(0, 12, 128);

    oled.drawStr(0, 24, r1);
    oled.drawStr(0, 36, r2);
    oled.drawStr(0, 48, r3);

    oled.drawHLine(0, 51, 128);
    oled.setFont(u8g2_font_5x7_tf);
    oled.drawStr(0, 63, ft);

    oled.sendBuffer();
}

void oledMsg(const char* l1, const char* l2) {
    oled.clearBuffer();
    oled.setFont(u8g2_font_6x10_tf);
    oled.drawStr(0, 16, l1);
    if (l2 && l2[0]) oled.drawStr(0, 32, l2);
    oled.sendBuffer();
}

// ============================================================================
// UTILITY
// ============================================================================
void blinkLED(uint8_t n, uint16_t ms) {
    for (uint8_t i = 0; i < n; i++) {
        digitalWrite(PIN_LED, HIGH); delay(ms);
        digitalWrite(PIN_LED, LOW);  delay(ms);
    }
}