#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHT_PIN 19      // Pin where DHT is connected
#define SWITCH_PIN 17   // Pin where the switch is connected
#define WIFI_SSID "VisawaHouse_2.4G"
#define WIFI_PASS "mag0859603510"
#define API_KEY "z9LRcZFD09RzMdFJg0OwInK9iMhldA90Tz9h9XXc2rsTrPGmRhMRP06sq4JNXhiLUkrXyS63Nxl4xhtLvmDJqalVjl6E1Zz4NTKX2Z8c315MxYLhubajSQjEbGIv62IE"

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT11);

void send_sensor_data(float temperature, float humidity, bool switchStatus) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;  // Create an HTTPClient instance
        String url = "http://192.168.1.119:3300/sensor-data";  // Ensure this IP is correct

        // Prepare the JSON payload
        String post_data = "{\"temperature\":" + String(temperature, 2) + 
                           ", \"humidity\":" + String(humidity, 2) + 
                           ", \"switchStatus\":" + String(switchStatus) + 
                           ", \"apiKey\":\"" + API_KEY + "\"}";

        // Configure the HTTP request
        http.begin(url);  // Specify the URL
        http.addHeader("Content-Type", "application/json");  // Specify content-type header

        // Send the request
        int httpResponseCode = http.POST(post_data);  // Send the HTTP POST request

        // Check for the response
        if (httpResponseCode > 0) {
            Serial.printf("HTTP Response code: %d\n", httpResponseCode);
            if (httpResponseCode == 200) {
                Serial.println("Data sent successfully");
            }
        } else {
            Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();  // Close connection
    } else {
        Serial.println("WiFi not connected");
    }
}

void setup() {
    // Start serial communication for debugging
    Serial.begin(115200);

    // Initialize DHT sensor
    dht.begin();

    // Initialize WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.println("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Connected to WiFi!");

    // Set up switch pin mode
    pinMode(SWITCH_PIN, INPUT_PULLUP); // Assuming the switch is active low
}

void loop() {
    // Read temperature and humidity
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    // Check if any reads failed
    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Failed to read from DHT sensor!");
        delay(2000);  // Wait a few seconds before retrying
        return;
    }

    // Read the switch status (LOW means pressed)
    bool switchStatus = digitalRead(SWITCH_PIN) == LOW;

    // Debug output
    Serial.printf("Temperature: %.2f°C, Humidity: %.2f%%, Switch: %s\n", 
                  temperature, humidity, switchStatus ? "ON" : "OFF");

    // Send sensor data
    send_sensor_data(temperature, humidity, switchStatus);

    // Delay before the next reading
    delay(1000);  // Wait 1 second
}
