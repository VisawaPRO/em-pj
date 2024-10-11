const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3300;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/sensorDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema for the sensor data
const sensorSchema = new mongoose.Schema({
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    switchStatus: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
const SensorData = mongoose.model('SensorData', sensorSchema);

// Store the last received sensor data
let lastSensorData = {};

// Endpoint for handling incoming sensor data
app.post('/sensor-data', (req, res) => {
    lastSensorData = req.body;  // Update the last sensor data
    console.log(lastSensorData);  // Log incoming data

    const sensorData = new SensorData({
        temperature: lastSensorData.temperature,
        humidity: lastSensorData.humidity,
        switchStatus: lastSensorData.switchStatus
    });

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

// Example endpoint for serving index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

