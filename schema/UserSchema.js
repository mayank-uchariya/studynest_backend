import mongoose from "mongoose";

const guarantorSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Invalid email format"],
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"],
  },
  relationship: {
    type: String,
    trim: true,
  },
});

export const userSchema = new mongoose.Schema(
  {
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
      match: [/.+@.+\..+/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"],
    },
    moveInDate: {
      type: Date,
      default: null,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },
    stayDuration: {
      type: Number, // Duration in days
      min: [1, "Stay duration must be at least 1 day"],
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Non-binary", "Other"],
    },
    guarantors: {
      type: [guarantorSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create models
const User = mongoose.model("User", userSchema);

export default User;
