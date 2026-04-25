const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect DB
const dbUri = process.env.mongo_db || 'mongodb://127.0.0.1:27017/imageGeneration';
mongoose.connect(dbUri, {})
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const imageRoutes = require('./routes/image');

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', imageRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
