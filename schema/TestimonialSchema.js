import mongoose from "mongoose";

export const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  feedback: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Validate email format
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const testimonial = mongoose.model("Testimonial", testimonialSchema);

export default testimonial;
