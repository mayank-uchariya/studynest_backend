import mongoose from "mongoose";
import User from "./UserSchema.js";

const { Schema } = mongoose;

// Property schema
export const propertySchema = new Schema(
  {
    slug: {
      type: String,
      unique: true,
      required: true,
    },
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
    university: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
      validate: [(array) => array.length > 0, "At least one image is required"],
    },
    area: {
      type: String,
      required: true,
    },
    services: [
      {
        type: String,
        required: true,
      },
    ],
    amenities: [
      {
        title: {
          type: String,
        },
        items: [
          {
            type: String,
          },
        ],
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    // reviews: [
    //   {
    //     user: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: User, // Reference to the User model
    //       default: null, // Allows null values for user
    //     },
    //     rating: {
    //       type: Number,
    //       min: 1,
    //       max: 5,
    //     },
    //     comment: {
    //       type: String,
    //     },
    //   },
    // ], // Nested review schema
    views: {
      type: Number,
      default: 0,
    },
    lastViewedReset: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save hook to ensure users can only leave one review (non-null) per property
// propertySchema.pre("save", async function (next) {
//   const property = this;

//   // Filter non-null users from the reviews array
//   const userIds = property.reviews
//     .filter((review) => review.user) // Exclude `null` users
//     .map((review) => review.user.toString());

//   // Create a Set to get unique user IDs
//   const uniqueUserIds = new Set(userIds);

//   // Check for duplicates (users can leave only one review)
//   if (userIds.length !== uniqueUserIds.size) {
//     return next(new Error("Each user can only review a property once."));
//   }

//   next(); // Proceed with saving if no issues
// });

// Method to increment views
propertySchema.methods.incrementViews = async function () {
  const currentDate = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1);

  // Reset views if last reset was more than a month ago
  if (this.lastViewedReset < oneMonthAgo) {
    this.views = 0;
    this.lastViewedReset = currentDate;
  }

  // Increment views
  this.views += 1;
  await this.save();
};

const Property = mongoose.model("Property", propertySchema);

export default Property;
