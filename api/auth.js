import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../schema/UserSchema.js'; // Import the User model

const router = express.Router();

// JWT Secret (use a strong secret and store it in `.env`)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/signup', async (req, res) => {
    const { name, email, phone, password, moveInDate, moveOutDate, dateOfBirth, nationality, gender, guarantors } = req.body;
  
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Calculate stay duration
    const stayDuration = Math.ceil((new Date(moveOutDate) - new Date(moveInDate)) / (1000 * 60 * 60 * 24));
  
    try {
      // Create a new user
      const newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        moveInDate,
        moveOutDate,
        stayDuration,
        dateOfBirth,
        nationality,
        gender,
        guarantors,
      });
  
      await newUser.save();
  
      res.status(201).json({ message: 'User created successfully', userId: newUser._id });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  });  

  router.get('/user/:id', async (req, res) => {
    const userId = req.params.id; // Get user ID from route params
  
    try {
      // Find user by ID
      const user = await User.findById(userId).select('-password'); // Exclude the password field
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

export default router;