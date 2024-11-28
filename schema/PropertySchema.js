import mongoose from 'mongoose';
import {userSchema} from './UserSchema.js';

const { Schema } = mongoose;

const reviewSchema = new Schema({
  user: [userSchema],
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
});

const amenitiesSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  items: [{
    type: String,
    required: true,
  }],
});

const propertySchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  area: {
    type: String,
    required: true,
  },
  services: [{
    type: String,
    required: true,
  }],
  amenities: [amenitiesSchema],
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  reviews: [reviewSchema],
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Property = mongoose.model('Property', propertySchema);

export default Property;
