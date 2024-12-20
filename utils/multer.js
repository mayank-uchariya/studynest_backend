import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import path from 'path';


const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'properties',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    },
});


// Ensure the 'uploads' directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// Excel file storage configuration
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir); // Save Excel files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });


// File filter to allow only Excel files
const excelFileFilter = (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files are allowed'), false);
    }
};


const uploadImage = multer({ storage: imageStorage });
const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFileFilter
}) 

export { uploadImage, uploadExcel };

