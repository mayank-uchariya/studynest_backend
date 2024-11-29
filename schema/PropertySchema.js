import mongoose from 'mongoose';
import User from './UserSchema.js'

const { Schema } = mongoose;

const reviewSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User, // Assuming 'User' is your model name
    // required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    // required: true,
  },  
  comment: {
    type: String,
    // required: true,
  },
});

const amenitiesSchema = new Schema({
  title: {
    type: String,
    // required: true,
  },
  items: [{
    type: String,
    // required: true,
  }],
});

export const propertySchema = new Schema({
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
    index: true,
  },  
  country: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
    validate: [array => array.length > 0, 'At least one image is required'],
  },  
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
    // required: true,
  },  
  reviews: [reviewSchema],
  views: {
    type: Number,
    default: 0,
  },
  lastViewedReset: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Property = mongoose.model('Property', propertySchema);

export default Property;
