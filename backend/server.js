const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log('Failed to set Google/Cloudflare DNS servers, using default resolver.');
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/api');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'SalonSync Enterprise API is online.',
    version: '1.0.0'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SalonSync Server running on port ${PORT}`);
});

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://salonsync-iota.vercel.app"
    ],
    credentials: true,
  })
);