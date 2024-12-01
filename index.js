import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './api/auth.js';
import propertyAuthRoutes from './api/propertyauth.js'
import bodyParser from 'body-parser';

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());



// CORS Configuration
const allowedOrigins = ['https://studynestt.vercel.app'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Set true if cookies or credentials are used
}));



// MongoDB connection
const mongoURI = process.env.MONGO_URI;
// console.log(mongoURI)
mongoose
  .connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/propertyauth', propertyAuthRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// console.log(process.env.CLOUDINARY_API_KEY)
// console.log(process.env.CLOUDINARY_CLOUD_NAME)
// console.log(process.env.CLOUDINARY_API_SECRET)
// console.log(process.env.MONGO_URI)
// console.log(process.env.JWT_SECRET)
