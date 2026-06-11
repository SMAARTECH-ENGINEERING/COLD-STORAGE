#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>
#include "Adafruit_SGP40.h"

// -- GSM / HTTP ---------------------------------------------------------------
#define TINY_GSM_MODEM_SIM7600
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
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

// Render backend — port 443 HTTPS via modem built-in SSL
const char SERVER_HOST[] = "cold-storage-2.onrender.com";
const int  SERVER_PORT   = 443;

// Must match a deviceId registered in the backend DB
const char DEVICE_ID[] = "CS001";

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
// ============================================================================
#define NTC_NOMINAL_R   10000.0f
#define NTC_BCOEFF      3950.0f
#define NTC_SERIES_R    10000.0f
#define NTC_NOMINAL_T   298.15f
#define ADC_MAX         4095.0f

#define HUMIDITY_DEFAULT  85.0f

// ============================================================================
// TIMING
// ============================================================================
#define SENSOR_POST_MS       30000UL
#define GSM_WAIT_TIMEOUT_MS  60000UL
// 100 s — Render free tier cold start can take 50–80 s
#define HTTP_TIMEOUT_MS      100000

// ============================================================================
// GLOBAL STATE
// ============================================================================
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

// TinyGsmClientSecure uses the SIM7600's built-in SSL/TLS hardware —
// no SSLClient library or trust-anchor certificates needed on the ESP32.
TinyGsmClientSecure gsmClient(modem);

HttpClient http(gsmClient, SERVER_HOST, SERVER_PORT);

Adafruit_SGP40 sgp40;

U8G2_SSD1306_128X64_NONAME_F_HW_I2C oled(U8G2_R0, U8X8_PIN_NONE);

// ============================================================================
// FORWARD DECLARATIONS
// ============================================================================
bool   gsmConnect();
bool   wakeServer();
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
    analogReadResolution(12);
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
    delay(8000);

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

    // ---- Wake Render server (free tier sleeps after 15 min) -----------------
    oledMsg("Server", "Waking up...");
    wakeServer();

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
// WAKE SERVER  —  GET /health to force Render out of sleep before first POST.
//   Render free tier spins down after 15 min. First request wakes it (50–80 s).
// ============================================================================
bool wakeServer() {
    Serial.println(F("[WAKE] GET /health (Render cold-start may take ~80 s)"));
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.beginRequest();
    http.get("/health");
    http.sendHeader("Connection", "close");
    http.endRequest();

    int code = http.responseStatusCode();
    http.responseBody();  // flush
    Serial.printf("[WAKE] /health → HTTP %d\n", code);
    return (code == 200);
}

// ============================================================================
// NTC THERMISTOR TEMPERATURE READ (GPIO36 / ADC)
//   Wiring: 3.3V → 10kΩ resistor → GPIO36 → 10kΩ NTC → GND
// ============================================================================
float readNTC() {
    uint32_t raw = 0;
    for (uint8_t i = 0; i < 8; i++) { raw += analogRead(PIN_TEMP_ADC); delay(2); }
    float adcVal = raw / 8.0f;

    if (adcVal <= 0 || adcVal >= ADC_MAX) return g_temp;

    float resistance = NTC_SERIES_R * (ADC_MAX / adcVal - 1.0f);
    float steinhart  = log(resistance / NTC_NOMINAL_R) / NTC_BCOEFF;
    steinhart       += 1.0f / NTC_NOMINAL_T;
    return (1.0f / steinhart) - 273.15f;
}

// ============================================================================
// SENSOR READING
// ============================================================================
void readSensors() {
    float t = readNTC();
    if (t > -40.0f && t < 85.0f) g_temp = t;

    g_humidity = HUMIDITY_DEFAULT;

    g_vocIndex = sgp40.measureVocIndex(g_temp, g_humidity);

    g_doorOpen   = (digitalRead(PIN_DOOR) == HIGH);
    g_compressor = (digitalRead(PIN_COMPRESSOR) == HIGH);

    Serial.printf("[SENSOR] T=%.2f°C  H=%.0f%%  VOC=%d  Door=%s  Comp=%s\n",
        g_temp, g_humidity, g_vocIndex,
        g_doorOpen   ? "OPEN"   : "CLOSED",
        g_compressor ? "ON"     : "OFF");
}

// ============================================================================
// POST SENSOR DATA  →  POST /api/v1/sensors  (no auth required)
// ============================================================================
bool postReading() {
    StaticJsonDocument<256> payload;
    payload["deviceId"]   = DEVICE_ID;
    payload["temp"]       = g_temp;
    payload["hum"]        = g_humidity;
    payload["door"]       = g_doorOpen;
    payload["voc"]        = g_vocIndex;
    payload["compressor"] = g_compressor;

    char body[256];
    serializeJson(payload, body, sizeof(body));

    http.setTimeout(HTTP_TIMEOUT_MS);
    http.beginRequest();
    http.post("/api/v1/sensors");
    http.sendHeader("Content-Type",  "application/json");
    http.sendHeader("Content-Length", (int)strlen(body));
    http.sendHeader("Connection",    "close");
    http.beginBody();
    http.print(body);
    http.endRequest();

    int code = http.responseStatusCode();
    http.responseBody();  // flush

    Serial.printf("[HTTP] POST /api/v1/sensors → %d\n", code);
    return (code == 200 || code == 201);
}

// ============================================================================
// OLED DISPLAY  128×64
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
