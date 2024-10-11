const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');  // To handle file paths

const app = express();
const PORT = 3300;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB (update the connection string to refer to the Docker service)
mongoose.connect('mongodb://mongodb:27017/sensorDB', {  // Change 'localhost' to 'mongodb'
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema for the sensor data
const sensorSchema = new mongoose.Schema({
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    heatIndex: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
const SensorData = mongoose.model('SensorData', sensorSchema);

// Store the last received sensor data
let lastSensorData = {};

// Function to calculate heat index in Celsius
function calculateHeatIndex(temperature, humidity) {
    const c1 = -8.78469475556;
    const c2 = 1.61139411;
    const c3 = 2.33854883889;
    const c4 = -0.14611605;
    const c5 = -0.012308094;
    const c6 = -0.0164248277778;
    const c7 = 0.002211732;
    const c8 = 0.00072546;
    const c9 = -0.000003582;

    const heatIndex = c1 +
                    (c2 * temperature) +
                    (c3 * humidity) +
                    (c4 * temperature * humidity) +
                    (c5 * temperature * temperature) +
                    (c6 * humidity * humidity) +
                    (c7 * temperature * temperature * humidity) +
                    (c8 * temperature * humidity * humidity) +
                    (c9 * temperature * temperature * humidity * humidity);
    return heatIndex;
}

// Endpoint for handling incoming sensor data
app.post('/sensor-data', (req, res) => {
    const temperature = req.body.temperature;
    const humidity = req.body.humidity;

    // Calculate the heat index
    const heatIndex = calculateHeatIndex(temperature, humidity);

    // Store the sensor data with heat index
    lastSensorData = {
        temperature: temperature,
        humidity: humidity,
        heatIndex: heatIndex
    };

    // Create a new sensor data document
    const sensorData = new SensorData({
        temperature: temperature,
        humidity: humidity,
        heatIndex: heatIndex
    });

    // Save the document to the database
    sensorData.save()
        .then(() => {
            console.log('Data saved:', lastSensorData);
            res.send('Data received and saved to MongoDB');
        })
        .catch(error => {
            console.error('Error saving data:', error);
            res.status(500).send('Error saving data to MongoDB');
        });
});

// New endpoint to serve the last sensor data
app.get('/sensor-data', (req, res) => {
    res.json(lastSensorData);  // Return the last sensor data as JSON
});

// Example endpoint for serving index.html (served from 'public' folder)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
