import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

// Utility function to delete an image from Cloudinary
// export const deleteImageFromCloudinary = async (publicId) => {
//   try {
//     const result = await cloudinary.uploader.destroy(publicId);
//     console.log(`Cloudinary deletion result for ${publicId}:`, result);
//     return result;
//   } catch (error) {
//     console.error(`Error deleting image with public ID ${publicId}`, error);
//     throw error; // Ensure the error is propagated for proper handling
//   }
// };

// console.log(process.env.CLOUDINARY_API_KEY)
// console.log(process.env.CLOUDINARY_CLOUD_NAME)
// console.log(process.env.CLOUDINARY_API_SECRET)
// console.log(process.env.MONGO_URI)
// console.log(process.env.JWT_SECRET)

export default cloudinary;
