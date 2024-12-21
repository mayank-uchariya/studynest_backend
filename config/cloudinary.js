import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

// const testUpload = async () => {
//   try {
//     const result = await cloudinary.uploader.upload(
//       "https://via.placeholder.com/150",
//       {
//         folder: "test",
//       }
//     );
//     console.log("Cloudinary Test Upload Result:", result);
//   } catch (error) {
//     console.error("Error connecting to Cloudinary:", error);
//   }
// };

const testUpload = async () => {
  try {
    const result = await cloudinary.uploader.upload(
      'C:\\Users\\dell\\Downloads\\uploads\\sample-properties.xlsx', // Path to your Excel file
      {
        resource_type: 'raw', // Ensure this is set to raw
        folder: 'excel',
      }
    );
    console.log('Upload Successful:', result);
  } catch (error) {
    console.error('Error Uploading File:', error.message);
  }
};

// testUpload();

console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_SECRET);
console.log(process.env.MONGO_URI);
console.log(process.env.JWT_SECRET);

export default cloudinary;
