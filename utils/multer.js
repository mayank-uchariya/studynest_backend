import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'properties',
        allowed_formats: ['jpg', 'jpeg', 'png']
    },
});

// Separate storage configuration for Excel files
const excelStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'excel',
        allowed_formats: ['xlsx', 'xls'],
        resource_type: 'raw'
    }
});

const fileFilter = (req, file, cb) => {
    console.log('File MIME Type:', file.mimetype); // Debug log
    const allowedMimetypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
};


const uploadImage = multer({ 
    storage: imageStorage,
});

const uploadExcel = multer({
    storage: excelStorage,
    fileFilter,
});

export {uploadImage, uploadExcel};
