import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "properties",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

// Temporary local storage for Excel files
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for Excel files
const fileFilter = (req, file, cb) => {
  console.log("File MIME Type:", file.mimetype); // Debug log
  const allowedMimetypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Excel files are allowed."), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
});

const uploadExcel = multer({
  storage: tempStorage,
  fileFilter,
});

// Middleware for uploading Excel files to Cloudinary
const uploadExcelToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    const filePath = req.file.path;
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      folder: "excel",
    });

    // Attach the Cloudinary response to the request object
    req.file.cloudinaryResult = result;

    // Clean up local temp file
    fs.unlinkSync(filePath);

    next();
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error.message);
    res.status(500).json({ error: "Failed to upload file to Cloudinary" });
  }
};

export { uploadImage, uploadExcel, uploadExcelToCloudinary };
