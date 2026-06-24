require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON stuff
app.use(express.json());

// Import route Files
const fileRoutes = require('./routes/files');

// Mount API routes
app.use('/api/files', fileRoutes); //  prefixes all routes inside files.js with /api/files

// Base sanity check route, should work
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the DevDrop API!' });
});

// connection to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🚀 Successfully connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ Database connection error: ', err.message);
    process.exit(1); // Stop the server if can't connect to  database
  });

// Base route to make sure working
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the DevDrop API!' });
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`📡 Server running in development on port ${PORT}`);
});