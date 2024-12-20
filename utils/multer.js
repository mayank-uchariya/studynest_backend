import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'properties',
        allowed_formats: ['jpg', 'jpeg', 'png', 'xlsx'],
        resource_type: 'raw',
    },
});

const upload = multer({ storage });

export default upload;
