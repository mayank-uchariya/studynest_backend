import express from "express";
import Property from "../schema/PropertySchema.js";
import {uploadImage, uploadExcel} from "../utils/multer.js";
import cloudinary from "../config/cloudinary.js";
import xlsx from 'xlsx';
import fs from 'fs';


const router = express.Router();

const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    // console.log(`Cloudinary deletion result for ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting image with public ID ${publicId}`, error);
    throw error; // Ensure the error is propagated for proper handling
  }
};


// router.post('/upload-properties', uploadExcel.single('file'), async (req, res) => {
//   try {
//       if (!req.file) {
//           return res.status(400).json({ message: 'No file uploaded' });
//       }

//       const filePath = req.file.path;

//       // Read the Excel file
//       const workbook = XLSX.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//       if (!data || data.length === 0) {
//           return res.status(400).json({ message: 'Excel file is empty or improperly formatted' });
//       }

//       // Validate required fields
//       const requiredFields = ['title', 'price', 'city', 'country', 'description', 'university', 'area', 'services', 'amenities', 'roomTypes'];
//       const missingFields = data.some(item => 
//           requiredFields.some(field => !item[field])
//       );

//       if (missingFields) {
//           return res.status(400).json({ 
//               message: 'Some entries are missing required fields',
//               requiredFields 
//           });
//       }

//       // Map and save properties
//       const propertiesToSave = data.map((item) => ({
//           slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
//           title: item.title?.trim(),
//           price: Number(item.price),
//           city: item.city?.trim(),
//           country: item.country?.trim(),
//           description: item.description?.trim(),
//           university: item.university?.trim(),
//           area: item.area,
//           services: item.services ? item.services.split(',').map(s => s.trim()) : [],
//           amenities: item.amenities
//               ? item.amenities.split(';').map((amenity) => {
//                   const [title, items] = amenity.split(':').map(s => s.trim());
//                   return { 
//                       title, 
//                       items: items ? items.split(',').map(i => i.trim()) : []
//                   };
//               })
//               : [],
//           roomTypes: item.roomTypes
//               ? item.roomTypes.split(';').map((roomType) => {
//                   const [title, price] = roomType.split(':').map(s => s.trim());
//                   return { 
//                       title: title.trim(), 
//                       price: Number(price) || 0 
//                   };
//               })
//               : [],
//       }));

//       // Save properties to the database
//       await Property.insertMany(propertiesToSave);

//       res.status(200).json({ 
//           message: 'Properties uploaded successfully!',
//           count: propertiesToSave.length
//       });
//   } catch (error) {
//       console.error('Property upload error:', error);
//       res.status(500).json({ 
//           message: 'Error uploading properties', 
//           error: error.message 
//       });
//   }
// });

router.post('/upload-excel', uploadExcel.single('file'), async (req, res) => {
  try {
      // Check if file was uploaded
      if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get the file URL from Cloudinary
      const fileUrl = req.file.path;

      // Download the file locally (Cloudinary stores as a raw resource)
      const response = await fetch(fileUrl);
      const buffer = await response.buffer();
      const localFilePath = `./temp/${Date.now()}-${req.file.originalname}`;
      fs.writeFileSync(localFilePath, buffer);

      // Parse the Excel file
      const workbook = xlsx.readFile(localFilePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);

      // Clean up the temp file
      fs.unlinkSync(localFilePath);

      // Map and validate data before saving
      const properties = data.map((item) => ({
          name: item.Name,
          location: item.Location,
          price: item.Price,
          description: item.Description,
          imageUrls: item.ImageUrls ? item.ImageUrls.split(',') : [],
      }));

      // Save to the database
      await Property.insertMany(properties);

      res.status(200).json({ message: 'Properties added successfully!' });
  } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ message: 'An error occurred while processing the file' });
  }
});


// Create a new property with image upload
router.post("/property", uploadImage.array("images", 5), async (req, res) => {
  try {
    // Log the request for debugging
    console.log("Request files:", req.files);
    console.log("Request body:", req.body);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // const propertyData = req.body;

    // Parse JSON fields from the request body
    const propertyData = {
      ...req.body,
      services: JSON.parse(req.body.services || "[]"),
      amenities: JSON.parse(req.body.amenities || "[]"),
      roomTypes: JSON.parse(req.body.roomTypes || "[]"),
    };

    const imageUrls = req.files.map((file) => file.path); // Use .path for Cloudinary URLs

    const newProperty = new Property({
      ...propertyData,
      images: imageUrls,
    });

    await newProperty.save();
    res.status(201).json({
      message: "Property created successfully",
      property: newProperty,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.put("/property/:id", uploadImage.array("images", 5), async (req, res) => {
  const propertyId = req.params.id;
  const updateData = req.body;

  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Handle image uploads
    if (req.body.replaceImages === "true") {
      // Replace all images
      const imageUrls = req.files.map((file) => file.path || file.secure_url);
      property.images = imageUrls;
    } else if (req.files.length > 0) {
      // Add new images
      const newImageUrls = req.files.map(
        (file) => file.path || file.secure_url
      );
      property.images.push(...newImageUrls);
    }

    // Parse `services` and `amenities` if they are strings
    if (typeof updateData.services === "string") {
      updateData.services = JSON.parse(updateData.services);
    }

    if (typeof updateData.amenities === "string") {
      updateData.amenities = JSON.parse(updateData.amenities);
    }

    if (typeof updateData.roomTypes === "string") {
      updateData.roomTypes = JSON.parse(updateData.roomTypes);
    }

    Object.assign(property, updateData);
    await property.save();

    res.status(200).json({
      message: "Property updated successfully",
      updatedProperty: property,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.delete("/property/:id", async (req, res) => {
  const propertyId = req.params.id;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Delete images from Cloudinary
    for (let image of property.images) {
      try {
        // Extract publicId by removing the version number
        const publicId = image
          .split("/image/upload/")[1] // Extract after 'upload/'
          .replace(/v\d+\//, "") // Remove the version number
          .split(".")[0]; // Remove the file extension
        // console.log(`Deleting image with publicId: ${publicId}`);

        const result = await deleteImageFromCloudinary(publicId);
        // console.log(`Cloudinary deletion result for ${publicId}:`, result);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete image ${image} from Cloudinary`,
          cloudinaryError
        );
      }
    }

    await Property.findByIdAndDelete(propertyId);
    res
      .status(200)
      .json({ message: "Property and images deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/properties", async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
  try {
    const properties = await Property.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Property.countDocuments();

    res.status(200).json({
      message: "Properties retrieved successfully",
      properties,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/property/:id", async (req, res) => {
  const propertyId = req.params.id;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Increment the view count
    await property.incrementViews();

    res
      .status(200)
      .json({ message: "Property retrieved successfully", property });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/property", async (req, res) => {
  const { title } = req.query;

  try {
    if (!title) {
      return res.status(400).json({ message: "Property title is required" });
    }

    // Search for properties matching the name (case-insensitive)
    const properties = await Property.find({
      title: { $regex: new RegExp(title, "i") }, // "i" makes it case-insensitive
    });

    if (properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }

    res.status(200).json({
      message: "Properties fetched successfully",
      properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// search route
// Search properties by city, country, or title
router.get("/properties/search", async (req, res) => {
  const { city, country, title } = req.query; // Extract query parameters

  try {
    // Create a dynamic filter object based on the provided query parameters
    const filter = {};
    if (city) filter.city = { $regex: city, $options: "i" }; // Case-insensitive regex match
    if (country) filter.country = { $regex: country, $options: "i" };
    if (title) filter.title = { $regex: title, $options: "i" };

    // Find properties matching the filter
    const properties = await Property.find(filter);

    if (properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }

    res.status(200).json({
      message: "Properties retrieved successfully",
      properties,
    });
  } catch (error) {
    console.error("Error searching properties:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/properties/filter", async (req, res) => {
  const { page = 1, limit = 10, country, city, minPrice, maxPrice } = req.query;

  try {
    const filters = {};

    if (country) filters.country = country;
    if (city) filters.city = city;
    if (minPrice) filters.price = { $gte: Number(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, $lte: Number(maxPrice) };

    const properties = await Property.find(filters)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Property.countDocuments(filters);

    res.status(200).json({
      message: "Properties retrieved successfully",
      properties,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
