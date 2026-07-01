// ============================================================
// govest (Go-Vest) — Firmware Fase 2: Tambah MQTT Publish
// ============================================================
// INI ADALAH FIRMWARE FASE 1 KAMU (Go-Vest_Fase1.ino) + TAMBAHAN MQTT.
// Semua bagian sensor/decision-tree/SIM800L/GPS TIDAK DIUBAH SAMA SEKALI -
// hanya menambahkan blok baru untuk publish data ke MQTT broker (HiveMQ Cloud)
// dan mengganti placeholder "[PLACEHOLDER MQTT]" dengan publish sungguhan.
//
// YANG BARU di Fase 2 ini:
//   1. WiFiClientSecure + PubSubClient untuk koneksi MQTT TLS ke HiveMQ Cloud
//   2. Root CA certificate (ISRG Root X1) di-embed untuk verifikasi TLS
//   3. publishTelemetry() - kirim semua data sensor setiap 3 detik
//   4. publishAlert() - kirim event darurat segera saat status danger berubah
//   5. mqttCallback() - terima command dari dashboard (tombol "Kirim WA Manual")
//   6. sendAlertWithFallback() DIUBAH: sekarang benar-benar publish MQTT,
//      bukan placeholder Serial.println saja
// ============================================================

#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>
#include <TinyGPSPlus.h>
#define TINY_GSM_MODEM_SIM800
#include <UniversalTelegramBot.h>
#include <TinyGsmClient.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "fall_decision_tree.h"

//WIFI
const char* ssid = "xxxx";
const char* pass = "xxxx";

// Bot TRelegram
const String BOT_TOKEN = "xxxx";
const String CHAT_ID = "xxxx";

// MQTT
const char* MQTT_HOST = "xxxx"; 
const int MQTT_PORT = 8883; 
const char* MQTT_USERNAME = "xxxx"; 
const char* MQTT_PASSWORD = "xxxx";

const char* WORKER_ID = "WRK-001";

const char* MQTT_ROOT_CA = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

// Pin-Pin
#define I2C_SDA 8
#define I2C_SCL 9
#define MQ135_PIN 4
#define BUZZER_PIN 45

#define SIM800_RX_PIN 17
#define SIM800_TX_PIN 18
#define SIM800_RST_PIN 5
#define TINY_GSM_DEBUG Serial

#define GPS_RX_PIN 15
#define GPS_TX_PIN 16

const int MPU_ADDR = 0x68;

// 
// Pembuatan Pbjek
MAX30105 particleSensor;
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
HardwareSerial sim800Serial(2);
TinyGsm modem(sim800Serial);

WiFiClientSecure mqttSecureClient;          
PubSubClient mqttClient(mqttSecureClient);  

WiFiClientSecure botClient;
UniversalTelegramBot bot(BOT_TOKEN, botClient);

// MPU6050 
float ax_g, ay_g, az_g;
//float gyroX_offset = 0, gyroY_offset = 0, gyroZ_offset = 0;
float gx_dps, gy_dps, gz_dps;
float total_G = 0;
float roll = 0, pitch = 0;
const float THRESHOLD_BAWAH = 2.1;
const float THRESHOLD_ATAS = 4.0;
unsigned long prevTimeMPU = 0;

// MAX30102
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
int32_t spo2Value = 0;
int8_t spo2Valid = 0;
int32_t heartRateValue = 0;
int8_t heartRateValid = 0;
volatile int beatAvg = 0;
volatile int spo2Latest = 0;
volatile bool vitalsValid = false;
const byte RATE_SIZE = 4;
int rates[RATE_SIZE];
byte rateSpot = 0;

// MQ-135
int gasValue = 0;
const int AMBANG_BAHAYA_GAS = 1500;
const unsigned long GAS_PREHEAT_MS = 30000;
unsigned long systemStartTime = 0;
bool gasSensorReady = false;

// GPS
double currentLat = 0, currentLon = 0;
bool gpsFixValid = false;

// status dan alaram
unsigned long timeLyingDownStart = 0;
unsigned long lastWaSentTime = 0;
unsigned long lastSmsSentTime = 0;
String lastSentMsg = "Aman";
const unsigned long ALERT_COOLDOWN = 15000;
const unsigned long SMS_COOLDOWN = 60000;

bool isLyingDown = false;
bool fallEventDetectedStage1 = false;
bool fallEventConfirmed = false;
String currentAlertMsg = "Aman";
bool isDanger = false;


// Sliding Window
const int ML_SAMPLE_RATE_HZ = 20;
const int ML_WINDOW_SIZE = 20;
float windowAx[ML_WINDOW_SIZE], windowAy[ML_WINDOW_SIZE], windowAz[ML_WINDOW_SIZE];
float windowGx[ML_WINDOW_SIZE], windowGy[ML_WINDOW_SIZE], windowGz[ML_WINDOW_SIZE];
int windowIndex = 0;
bool windowFull = false;
unsigned long lastMLSampleTime = 0;
const unsigned long ML_SAMPLE_INTERVAL_MS = 1000 / ML_SAMPLE_RATE_HZ;


// Interval publish reconeect mqtt
unsigned long lastMqttPublishTime = 0;
const unsigned long MQTT_PUBLISH_INTERVAL_MS = 100; // kirim telemetry tiap 0.1 detik
unsigned long lastMqttReconnectAttempt = 0;
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 1000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  systemStartTime = millis();

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  analogReadResolution(12);

  Wire.begin(I2C_SDA, I2C_SCL);

  setupMPU6050();
  setupMAX30102();
  setupGPS();
  setupWiFi();
  delay(1000); 
  setupSIM800L();
  setupMQTT(); 

  Serial.println("\n=== govest Fase 2 (MQTT) - Inisialisasi Selesai ===");

  xTaskCreatePinnedToCore(
    spo2Task, "SpO2Task", 10000, NULL, 1, NULL, 0
  );
}

void loop() {
  readMPU6050();
  readMQ135();
  readGPSContinuous();

  maintainMqttConnection(); 

  evaluateAlarms();
  publishTelemetryPeriodic(); 

  printToSerial();
  printToSerialPlotter();

  delay(10);
}

void setupMPU6050() {
//  Wire.beginTransmission(MPU_ADDR);
//  Wire.write(0x6B);
//  Wire.write(0);
//  Wire.endTransmission(true);
//  Serial.println("MPU6050 diinisialisasi. Memulai kalibrasi Gyro (JANGAN GERAKKAN ALAT)...");
//
//  long sumGx = 0, sumGy = 0, sumGz = 0;
//  int numSamples = 500;
//
//  for (int i = 0; i < numSamples; i++) {
//    Wire.beginTransmission(MPU_ADDR);
//    Wire.write(0x43);
//    Wire.endTransmission(false);
//    Wire.requestFrom(MPU_ADDR, 6, true);
//
//    sumGx += (Wire.read() << 8 | Wire.read());
//    sumGy += (Wire.read() << 8 | Wire.read());
//    sumGz += (Wire.read() << 8 | Wire.read());
//    delay(3);
//  }
//
//  gyroX_offset = (sumGx / numSamples) / 131.0;
//  gyroY_offset = (sumGy / numSamples) / 131.0;
//  gyroZ_offset = (sumGz / numSamples) / 131.0;
//
//  Serial.print("Kalibrasi selesai. Offset (X,Y,Z): ");
//  Serial.print(gyroX_offset); Serial.print(", ");
//  Serial.print(gyroY_offset); Serial.print(", ");
//  Serial.println(gyroZ_offset);

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);
  Serial.println("MPU6050 diinisialisasi.");
}

void readMPU6050() {
  unsigned long currentMillis = millis();
  if (currentMillis - prevTimeMPU < 20) return;

  float dt = (currentMillis - prevTimeMPU) / 1000.0;
  prevTimeMPU = currentMillis;

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  if (Wire.available() < 14) {
    Serial.println(">>> PERINGATAN: MPU6050 tidak merespons, cek wiring I2C (GPIO8/9).");
    return;
  }

  int16_t raw_ax = (Wire.read() << 8 | Wire.read());
  int16_t raw_ay = (Wire.read() << 8 | Wire.read());
  int16_t raw_az = (Wire.read() << 8 | Wire.read());
  Wire.read(); Wire.read();
  int16_t raw_gx = (Wire.read() << 8 | Wire.read());
  int16_t raw_gy = (Wire.read() << 8 | Wire.read());
  int16_t raw_gz = (Wire.read() << 8 | Wire.read());



  ax_g = raw_ax / 16384.0;
  ay_g = raw_ay / 16384.0;
  az_g = raw_az / 16384.0;

  //  gx_dps = (raw_gx / 131.0) - gyroX_offset;
  //  gy_dps = (raw_gy / 131.0) - gyroY_offset;
  //  gz_dps = (raw_gz / 131.0) - gyroZ_offset;

  gx_dps = raw_gx / 131.0;
  gy_dps = raw_gy / 131.0;
  gz_dps = raw_gz / 131.0; 

  total_G = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);

  if (total_G > 0.1) {
    float accRoll = atan2(ay_g, az_g) * 180 / PI;
    float accPitch = atan2(-ax_g, sqrt(ay_g * ay_g + az_g * az_g)) * 180 / PI;
    roll = 0.96 * (roll + gx_dps * dt) + 0.04 * accRoll;
    pitch = 0.96 * (pitch + gy_dps * dt) + 0.04 * accPitch;
  }

  if (currentMillis - lastMLSampleTime >= ML_SAMPLE_INTERVAL_MS) {
    lastMLSampleTime = currentMillis;
    pushToWindow(ax_g, ay_g, az_g, gx_dps, gy_dps, gz_dps);
  }
}

void setupMAX30102() {
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println(">>> MAX30102 GAGAL diinisialisasi! Cek wiring I2C dan power.");
    return;
  }

  byte ledBrightness = 60;
  byte sampleAverage = 4;
  byte ledMode = 2;
  int sampleRate = 100;
  int pulseWidth = 411;
  int adcRange = 4096;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setPulseAmplitudeRed(0x3C);
  particleSensor.setPulseAmplitudeIR(0x3C);
  Serial.println("MAX30102 diinisialisasi (mode BPM + SpO2).");
}

void spo2Task(void* parameter) {
  for (;;) {
    for (int i = 0; i < BUFFER_SIZE; i++) {
      while (!particleSensor.available()) {
        particleSensor.check();
      }
      redBuffer[i] = particleSensor.getFIFORed();
      irBuffer[i] = particleSensor.getFIFOIR();
      particleSensor.nextSample();
    }

    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_SIZE, redBuffer,
      &spo2Value, &spo2Valid, &heartRateValue, &heartRateValid
    );

    bool hrReasonable = heartRateValid && heartRateValue > 20 && heartRateValue < 255;
    bool spo2Reasonable = spo2Valid && spo2Value > 0 && spo2Value <= 100;

    if (hrReasonable) {
      rates[rateSpot++] = heartRateValue;
      rateSpot %= RATE_SIZE;
      int tempAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) tempAvg += rates[x];
      beatAvg = tempAvg / RATE_SIZE;
    }
    if (spo2Reasonable) spo2Latest = spo2Value;
    vitalsValid = hrReasonable && spo2Reasonable;

    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

void readMQ135() {
  if (millis() - systemStartTime < GAS_PREHEAT_MS) {
    if (!gasSensorReady) {
      static unsigned long lastWarn = 0;
      if (millis() - lastWarn > 5000) {
        lastWarn = millis();
        Serial.print("MQ-135 masih pemanasan... ");
        Serial.print((GAS_PREHEAT_MS - (millis() - systemStartTime)) / 1000);
        Serial.println(" detik lagi.");
      }
    }
    gasValue = 0;
    return;
  }
  gasSensorReady = true;

  long sum = 0;
  const int numReadings = 10;
  for (int i = 0; i < numReadings; i++) {
    sum += analogRead(MQ135_PIN);
    delayMicroseconds(100);
  }
  gasValue = sum / numReadings;
}

void setupGPS() {
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS NEO-7M diinisialisasi (menunggu satelit).");
}

void readGPSContinuous() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
  if (gps.location.isValid()) {
    currentLat = gps.location.lat();
    currentLon = gps.location.lng();
    gpsFixValid = true;
  } else {
    gpsFixValid = false;
  }
}

String getMapsLink() {
  if (!gpsFixValid) return "Lokasi tidak tersedia (GPS belum fix)";
  String link = "https://maps.google.com/?q=" + String(currentLat, 6) + "," + String(currentLon, 6);
  return link;
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, pass);

  Serial.print("Menghubungkan ke WiFi");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi terhubung.");
    botClient.setInsecure();
  } else {
    Serial.println("\nWiFi GAGAL terhubung. Sistem akan mengandalkan SIM800L untuk notifikasi.");
  }
}

void setupMQTT() {
  mqttSecureClient.setCACert(MQTT_ROOT_CA);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);

  connectMQTT();
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("Menghubungkan ke MQTT broker...");
  String clientId = "govest-" + String(WORKER_ID);

  if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" terhubung!");

    String commandTopic = "govest/" + String(WORKER_ID) + "/command";
    mqttClient.subscribe(commandTopic.c_str());
    Serial.println("Subscribe ke: " + commandTopic);
  } else {
    Serial.print(" gagal, rc=");
    Serial.println(mqttClient.state());
  }
}

void maintainMqttConnection() {
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt > MQTT_RECONNECT_INTERVAL_MS) {
      lastMqttReconnectAttempt = now;
      connectMQTT();
    }
  } else {
    mqttClient.loop();
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  Serial.println("MQTT command diterima: " + message);

  if (message.indexOf("send_manual_alert") >= 0) {
    Serial.println("Perintah manual dari dashboard - mengirim alert via fallback...");
    sendAlertWithFallback("[MANUAL DARI DASHBOARD] " + currentAlertMsg);
  }
}

void publishTelemetryPeriodic() {
  unsigned long now = millis();
  if (now - lastMqttPublishTime < MQTT_PUBLISH_INTERVAL_MS) return;
  lastMqttPublishTime = now;

  if (!mqttClient.connected()) return; 

  String topic = "govest/" + String(WORKER_ID) + "/telemetry";
  String payload = buildTelemetryJson();

  bool published = mqttClient.publish(topic.c_str(), payload.c_str());
  if (!published) {
    Serial.println(">>> Publish telemetry GAGAL (cek ukuran payload / koneksi).");
  }
}

void publishAlertImmediate() {
  if (!mqttClient.connected()) return;

  String topic = "govest/" + String(WORKER_ID) + "/alert";
  String payload = buildAlertJson();
  mqttClient.publish(topic.c_str(), payload.c_str());
}

String buildTelemetryJson() {
  String json = "{";
  json += "\"worker_id\":\"" + String(WORKER_ID) + "\",";
  json += "\"bpm\":" + String(beatAvg) + ",";
  json += "\"spo2\":" + String(spo2Latest) + ",";
  json += "\"gas_value\":" + String(gasValue) + ",";
  json += "\"total_g\":" + String(total_G, 2) + ",";
  json += "\"roll\":" + String(roll, 1) + ",";
  json += "\"pitch\":" + String(pitch, 1) + ",";
  json += "\"lat\":" + String(currentLat, 6) + ",";
  json += "\"lon\":" + String(currentLon, 6) + ",";
  json += "\"gps_fix_valid\":" + String(gpsFixValid ? "true" : "false") + ",";
  json += "\"is_danger\":" + String(isDanger ? "true" : "false") + ",";
  json += "\"alert_message\":\"" + currentAlertMsg + "\",";
  json += "\"fall_confirmed\":" + String(fallEventConfirmed ? "true" : "false");
  json += "}";
  return json;
}

String buildAlertJson() {
  String json = "{";
  json += "\"worker_id\":\"" + String(WORKER_ID) + "\",";
  json += "\"cause\":\"" + currentAlertMsg + "\",";
  json += "\"lat\":" + String(currentLat, 6) + ",";
  json += "\"lon\":" + String(currentLon, 6) + ",";
  json += "\"maps_link\":\"" + getMapsLink() + "\"";
  json += "}";
  return json;
}

void setupSIM800L() {
  sim800Serial.begin(9600, SERIAL_8N1, SIM800_RX_PIN, SIM800_TX_PIN);
  delay(3000);

  Serial.println("Menginisialisasi SIM800L...");
  if (modem.restart()) {
    Serial.println("SIM800L siap. Info: " + modem.getModemInfo());
  } else {
    Serial.println(">>> SIM800L GAGAL inisialisasi. Cek wiring & power.");
  }
}

void sendBackupSMS(String message) {
  const char* nomorTujuan = "+xxxx";

  int signalQuality = modem.getSignalQuality();
  if (signalQuality == 99) {
    Serial.println(">>> SMS dibatalkan: tidak ada sinyal jaringan SIM800L.");
    return;
  }

  bool sent = modem.sendSMS(nomorTujuan, message);
  if (sent) {
    Serial.println(">>> SMS backup berhasil dikirim.");
  } else {
    Serial.println(">>> SMS backup GAGAL dikirim.");
  }
}

void sendAlertWithFallback(String message) {
  bool wifiOk = (WiFi.status() == WL_CONNECTED);
  bool mqttOk = mqttClient.connected();
  
  String fullMsg = "DARURAT govest!\n" + message + "\nLokasi: " + getMapsLink();

  if (wifiOk) {
    Serial.println("Mengirim alert via Telegram...");
    bot.sendMessage(CHAT_ID, fullMsg, "");
    
    if (mqttOk) {
      Serial.println("Mengirim alert via MQTT...");
      publishAlertImmediate();
    }
  } else {
    if (millis() - lastSmsSentTime > SMS_COOLDOWN) {
      Serial.println("WiFi/MQTT tidak tersedia - mengirim SMS backup...");
      sendBackupSMS(fullMsg);
      lastSmsSentTime = millis();
    }
  }
}

void pushToWindow(float ax, float ay, float az, float gx, float gy, float gz) {
  windowAx[windowIndex] = ax;
  windowAy[windowIndex] = ay;
  windowAz[windowIndex] = az;
  windowGx[windowIndex] = gx;
  windowGy[windowIndex] = gy;
  windowGz[windowIndex] = gz;

  windowIndex = (windowIndex + 1) % ML_WINDOW_SIZE;
  if (windowIndex == 0) windowFull = true;
}

FallFeatures extractFeaturesFromWindow() {
  FallFeatures f;

  float magAcc[ML_WINDOW_SIZE];
  float magGyro[ML_WINDOW_SIZE];
  float tilt[ML_WINDOW_SIZE];

  float sumAx = 0, sumAy = 0, sumAz = 0;
  float sumGx = 0, sumGy = 0, sumGz = 0;

  for (int i = 0; i < ML_WINDOW_SIZE; i++) {
    magAcc[i] = sqrt(windowAx[i]*windowAx[i] + windowAy[i]*windowAy[i] + windowAz[i]*windowAz[i]);
    magGyro[i] = sqrt(windowGx[i]*windowGx[i] + windowGy[i]*windowGy[i] + windowGz[i]*windowGz[i]);
    tilt[i] = atan2(sqrt(windowAx[i]*windowAx[i] + windowAy[i]*windowAy[i]), windowAz[i]) * 180.0 / PI;

    sumAx += windowAx[i]; sumAy += windowAy[i]; sumAz += windowAz[i];
    sumGx += windowGx[i]; sumGy += windowGy[i]; sumGz += windowGz[i];
  }

  float meanAx = sumAx / ML_WINDOW_SIZE, meanAy = sumAy / ML_WINDOW_SIZE, meanAz = sumAz / ML_WINDOW_SIZE;
  float meanGx = sumGx / ML_WINDOW_SIZE, meanGy = sumGy / ML_WINDOW_SIZE, meanGz = sumGz / ML_WINDOW_SIZE;

  float sumSqAx = 0, sumSqAy = 0, sumSqAz = 0, sumSqGx = 0, sumSqGy = 0, sumSqGz = 0;
  float sumMagAcc = 0, sumMagGyro = 0, sumTilt = 0;
  float maxMagAcc = magAcc[0], minMagAcc = magAcc[0], maxMagGyro = magGyro[0];
  float tiltMax = tilt[0], tiltMin = tilt[0];

  for (int i = 0; i < ML_WINDOW_SIZE; i++) {
    sumSqAx += (windowAx[i]-meanAx)*(windowAx[i]-meanAx);
    sumSqAy += (windowAy[i]-meanAy)*(windowAy[i]-meanAy);
    sumSqAz += (windowAz[i]-meanAz)*(windowAz[i]-meanAz);
    sumSqGx += (windowGx[i]-meanGx)*(windowGx[i]-meanGx);
    sumSqGy += (windowGy[i]-meanGy)*(windowGy[i]-meanGy);
    sumSqGz += (windowGz[i]-meanGz)*(windowGz[i]-meanGz);

    sumMagAcc += magAcc[i];
    sumMagGyro += magGyro[i];
    sumTilt += tilt[i];

    if (magAcc[i] > maxMagAcc) maxMagAcc = magAcc[i];
    if (magAcc[i] < minMagAcc) minMagAcc = magAcc[i];
    if (magGyro[i] > maxMagGyro) maxMagGyro = magGyro[i];
    if (tilt[i] > tiltMax) tiltMax = tilt[i];
    if (tilt[i] < tiltMin) tiltMin = tilt[i];
  }

  float meanMagAcc = sumMagAcc / ML_WINDOW_SIZE;
  float sumSqMagAcc = 0;
  for (int i = 0; i < ML_WINDOW_SIZE; i++) {
    sumSqMagAcc += (magAcc[i] - meanMagAcc) * (magAcc[i] - meanMagAcc);
  }
  float stdMagAcc = sqrt(sumSqMagAcc / ML_WINDOW_SIZE);

  float meanMagGyro = sumMagGyro / ML_WINDOW_SIZE;
  float meanTilt = sumTilt / ML_WINDOW_SIZE;

  float maxJerk = 0, sumSqJerk = 0;
  for (int i = 1; i < ML_WINDOW_SIZE; i++) {
    float jerk = magAcc[i] - magAcc[i-1];
    if (abs(jerk) > maxJerk) maxJerk = abs(jerk);
    sumSqJerk += jerk * jerk;
  }
  float stdJerk = sqrt(sumSqJerk / (ML_WINDOW_SIZE - 1));

  f.mean_ax = meanAx;
  f.mean_ay = meanAy;
  f.mean_az = meanAz;
  f.std_ax = sqrt(sumSqAx / ML_WINDOW_SIZE);
  f.std_ay = sqrt(sumSqAy / ML_WINDOW_SIZE);
  f.std_az = sqrt(sumSqAz / ML_WINDOW_SIZE);
  f.mean_magnitude = meanMagAcc;
  f.std_magnitude = stdMagAcc;
  f.max_magnitude = maxMagAcc;
  f.min_magnitude = minMagAcc;
  f.mean_gx = meanGx;
  f.mean_gy = meanGy;
  f.mean_gz = meanGz;
  f.std_gx = sqrt(sumSqGx / ML_WINDOW_SIZE);
  f.std_gy = sqrt(sumSqGy / ML_WINDOW_SIZE);
  f.std_gz = sqrt(sumSqGz / ML_WINDOW_SIZE);
  f.mean_gyro_magnitude = meanMagGyro;
  f.max_gyro_magnitude = maxMagGyro;
  f.max_jerk = maxJerk;
  f.std_jerk = stdJerk;
  f.mean_tilt = meanTilt;
  f.tilt_range = (tiltMax - tiltMin);

  return f;
}

bool validateFallWithML() {
  if (!windowFull) return false;
  FallFeatures features = extractFeaturesFromWindow();
  int result = predictFallDecisionTree(features);
  return result == 1;
}

void evaluateAlarms() {
  unsigned long now = millis();

  bool currentLying = (abs(roll) >= 80 && abs(roll) <= 110) || (abs(pitch) >= 80 && abs(pitch) <= 110);

  if (currentLying && !isLyingDown) {
    timeLyingDownStart = now;
    isLyingDown = true;
  } else if (!currentLying) {
    isLyingDown = false;
    fallEventDetectedStage1 = false;
    fallEventConfirmed = false;
  }

  unsigned long lyingDuration = isLyingDown ? (now - timeLyingDownStart) : 0;
  bool lying1Min = lyingDuration > 60000;
  bool lying5Min = lyingDuration > 300000;

  if (total_G >= THRESHOLD_BAWAH && total_G <= THRESHOLD_ATAS) {
    fallEventDetectedStage1 = true;

    if (!fallEventConfirmed) {
      fallEventConfirmed = validateFallWithML();
      if (fallEventDetectedStage1 && !fallEventConfirmed) {
        Serial.println("[Tahap 2 - Decision Tree] Threshold lolos tapi pohon menolak -> dianggap BUKAN jatuh.");
      }
    }
  }

  bool hrFast = (beatAvg > 120);
  bool hrSlow = (beatAvg > 10 && beatAvg < 50);
  bool gasDanger = (gasSensorReady && gasValue > AMBANG_BAHAYA_GAS);
  bool spo2Danger = (spo2Latest > 0 && spo2Latest < 90);

  isDanger = true;
  if (fallEventConfirmed && lying5Min && hrSlow) currentAlertMsg = "Jatuh, Tertidur >5Mnt, HR Lambat!";
  else if (fallEventConfirmed && lying5Min && hrFast) currentAlertMsg = "Jatuh, Tertidur >5Mnt, HR Cepat!";
  else if (fallEventConfirmed && lying1Min && hrFast) currentAlertMsg = "Jatuh, Tertidur >1Mnt, HR Cepat!";
  else if (spo2Danger) currentAlertMsg = "Saturasi Oksigen Rendah (SpO2 < 90%)!";
  else if (lying1Min) currentAlertMsg = "Tertidur >1Mnt";
  else if (lying5Min && hrSlow) currentAlertMsg = "Pingsan >5Mnt, HR Lambat!";
  else if (lying5Min && hrFast) currentAlertMsg = "Pingsan >5Mnt, HR Cepat!";
  else if (fallEventConfirmed && lying5Min) currentAlertMsg = "Jatuh & Tertidur > 5Mnt!";
  else if (gasDanger) currentAlertMsg = "Gas Berbahaya (CO/Asap) Terdeteksi!";
  else if (hrFast) currentAlertMsg = "Detak Jantung Terlalu Cepat!";
  else if (hrSlow) currentAlertMsg = "Detak Jantung Terlalu Lambat!";
  else if (fallEventConfirmed) currentAlertMsg = "Pekerja Terdeteksi Jatuh! (terkonfirmasi Decision Tree)";
  else {
    isDanger = false;
    currentAlertMsg = "Aman";
  }

  digitalWrite(BUZZER_PIN, isDanger ? HIGH : LOW);
  if (isDanger && (currentAlertMsg != lastSentMsg) && (now - lastWaSentTime > ALERT_COOLDOWN)) {
    sendAlertWithFallback(currentAlertMsg);
    lastWaSentTime = now;
    lastSentMsg = currentAlertMsg;
  }
  if (!isDanger && lastSentMsg != "Aman") {
    lastSentMsg = "Aman";
  }
}

void printToSerial() {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint < 1000) return;
  lastPrint = millis();

  Serial.println("========================================");
  Serial.print("Status        : "); Serial.println(currentAlertMsg);
  Serial.print("BPM           : "); Serial.println(beatAvg);
  Serial.print("SpO2          : "); Serial.print(spo2Latest); Serial.println("%");
  Serial.print("Gas (MQ135)   : "); Serial.println(gasValue);
  Serial.print("Total G       : "); Serial.println(total_G, 2);
  Serial.print("Roll / Pitch  : "); Serial.print(roll, 1); Serial.print(" / "); Serial.println(pitch, 1);
  Serial.print("GPS           : ");
  if (gpsFixValid) {
    Serial.print(currentLat, 6); Serial.print(", "); Serial.println(currentLon, 6);
  } else {
    Serial.println("Belum ada fix");
  }
  Serial.print("Fall Tahap-1  : "); Serial.println(fallEventDetectedStage1 ? "Lolos threshold" : "-");
  Serial.print("Fall Tahap-2  : "); Serial.println(fallEventConfirmed ? "TERKONFIRMASI (Decision Tree)" : "-");
  Serial.print("WiFi          : "); Serial.println(WiFi.status() == WL_CONNECTED ? "Terhubung" : "TIDAK terhubung");
  Serial.print("MQTT          : "); Serial.println(mqttClient.connected() ? "Terhubung" : "TIDAK terhubung");
}

void printToSerialPlotter() {
  static unsigned long lastPlot = 0;
  if (millis() - lastPlot < 100) return;
  lastPlot = millis();

  Serial.print("BPM:"); Serial.print(beatAvg);
  Serial.print(",SpO2:"); Serial.print(spo2Latest);
  Serial.print(",Gas:"); Serial.print(gasValue);
  Serial.print(",TotalG:"); Serial.print(total_G * 100);
  Serial.print(",Roll:"); Serial.print(roll);
  Serial.print(",Pitch:"); Serial.println(pitch);
}
