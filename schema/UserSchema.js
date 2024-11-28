import mongoose from 'mongoose';

const guarantorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Invalid email format'],
  },
  phone: {
    type: String,
    required: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'],
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
  },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    match: [/.+@.+\..+/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },  
  phone: {
    type: String,
    required: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'],
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  moveOutDate: {
    type: Date,
    required: true,
  },
  stayDuration: {
    type: Number, // Duration in days
    required: true,
    min: [1, 'Stay duration must be at least 1 day'],
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Non-binary', 'Other'],
  },
  guarantors: [guarantorSchema],
}, {
  timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

// Create models
const User = mongoose.model('User', userSchema);

export default User;
