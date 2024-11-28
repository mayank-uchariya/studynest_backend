import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


// Configure Multer to use Cloudinary as storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'property_images', // Cloudinary folder name
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed image formats
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional image transformation
  },
});

// Initialize Multer with the Cloudinary storage
const upload = multer({ storage });

export default upload;
