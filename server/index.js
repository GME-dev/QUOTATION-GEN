require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const quotationRoutes = require('./routes/quotationRoutes');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Serve static files
app.use('/static', express.static(path.join(__dirname, '..', 'public', 'static')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Suppress mongoose strictQuery warning
mongoose.set('strictQuery', false);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quotation-generator';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  if (err.name === 'MongoServerSelectionError') {
    console.error('Full error:', err);
  }
});

// API routes
app.use('/api/quotations', quotationRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});