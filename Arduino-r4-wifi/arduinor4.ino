#include <WiFiS3.h>
#include <LiquidCrystal.h>

// ---------------- LCD ----------------
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

// ---------------- WiFi ----------------
char ssid[] = "YOUR_SSID";
char pass[] = "PASSWORD";

WiFiClient client;

// ---------------- LED ----------------
const int wifiLED = 13;

// ---------------- Server ----------------
const char* server = "192.168.0.XXX";   // CHANGE THIS to your PC's LAN IP
int port = 3000;

unsigned long lastPoll = 0;
unsigned long lastHeartbeat = 0;

const unsigned long pollInterval = 10000;      // 10 seconds
const unsigned long heartbeatInterval = 10000; // 10 seconds

String deviceID = "arduino-r4-01";
String deviceName = "Arduino R4";

// ------------------------------------------------------------

void setup() {
  Serial.begin(9600);

  pinMode(wifiLED, OUTPUT);
  digitalWrite(wifiLED, LOW);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD OK");
  delay(2000);

  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("Connecting...");

  // Connect to WiFi
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    delay(500);
  }

  digitalWrite(wifiLED, HIGH); // WiFi connected

  lcd.clear();
  lcd.print("WiFi OK");

  delay(500);

  registerDevice();
}

// ------------------------------------------------------------

void loop() {
  unsigned long now = millis();

  if (now - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = now;
    sendHeartbeat();
  }

  if (now - lastPoll >= pollInterval) {
    lastPoll = now;
    fetchMessage();
  }
}

// ------------------------------------------------------------
// Register device with server
// ------------------------------------------------------------

void registerDevice() {
  if (!client.connect(server, port)) {
    Serial.println("Register failed");
    return;
  }

  String body = "id=" + deviceID + "&name=" + deviceName;

  client.println("POST /register HTTP/1.1");
  client.print("Host: "); client.println(server);
  client.println("Content-Type: application/x-www-form-urlencoded");
  client.print("Content-Length: "); client.println(body.length());
  client.println();
  client.print(body);

  delay(50);
  client.stop();

  Serial.println("Registered device");
}

// ------------------------------------------------------------
// Send heartbeat
// ------------------------------------------------------------

void sendHeartbeat() {
  if (!client.connect(server, port)) {
    Serial.println("Heartbeat failed");
    return;
  }

  String body = "id=" + deviceID;

  client.println("POST /heartbeat HTTP/1.1");
  client.print("Host: "); client.println(server);
  client.println("Content-Type: application/x-www-form-urlencoded");
  client.print("Content-Length: "); client.println(body.length());
  client.println();
  client.print(body);

  delay(50);
  client.stop();

  Serial.println("Heartbeat sent");
}

// ------------------------------------------------------------
// Fetch latest message
// ------------------------------------------------------------

void fetchMessage() {
  Serial.println("=== FETCH START ===");

  if (!client.connect(server, port)) {
    Serial.println("Fetch failed (no connection)");
    return;
  }

  client.println("GET /messages/latest HTTP/1.1");
  client.print("Host: "); client.println(server);
  client.println("Connection: close");
  client.println();

  // Wait for response
  while (client.connected() && !client.available()) {
    delay(10);
  }

  Serial.println("Reading response...");

  String response = "";
  while (client.available()) {
    response += client.readString();
  }
  client.stop();

  Serial.println("RAW RESPONSE:");
  Serial.println(response);

  Serial.println("Step A: Looking for JSON body");

  int jsonStart = response.indexOf("{");
  if (jsonStart == -1) {
    Serial.println("ERROR: No JSON found");
    return;
  }

  String json = response.substring(jsonStart);
  Serial.print("JSON BODY: ");
  Serial.println(json);

  Serial.println("Step B: Looking for \"text\" field");

  int t1 = json.indexOf("\"text\"");
  if (t1 == -1) {
    Serial.println("ERROR: No \"text\" field found");
    return;
  }

  t1 = json.indexOf("\"", t1 + 6);
  if (t1 == -1) {
    Serial.println("ERROR: Could not find start quote");
    return;
  }

  int t2 = json.indexOf("\"", t1 + 1);
  if (t2 == -1) {
    Serial.println("ERROR: Could not find end quote");
    return;
  }

  String msg = json.substring(t1 + 1, t2);

  Serial.print("Extracted message BEFORE cleanup: ");
  Serial.println(msg);

  msg.replace("\r", "");
  msg.replace("\n", "");

  Serial.print("Extracted message AFTER cleanup: ");
  Serial.println(msg);

  Serial.println("Step C: Writing to LCD");

  lcd.clear();
  lcd.print(msg.substring(0, 16));
  if (msg.length() > 16) {
    lcd.setCursor(0, 1);
    lcd.print(msg.substring(16, 32));
  }

  Serial.println("=== FETCH END ===");
}
