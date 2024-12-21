import express from "express";
import Property from "../schema/PropertySchema.js";
import {
  uploadImage,
  uploadExcel,
  uploadExcelToCloudinary,
} from "../utils/multer.js";
import cloudinary from "../config/cloudinary.js";
import XLSX from "xlsx";
import axios from "axios";

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

const processExcelFile = async (req, res) => {
  try {
    const { secure_url } = req.body; // URL of the uploaded Excel file
    if (!secure_url) {
      return res.status(400).json({ error: "No file URL provided" });
    }

    // Step 1: Download the Excel file
    const response = await axios.get(secure_url, {
      responseType: "arraybuffer",
    });

    // Step 2: Parse the Excel file into JSON
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Step 3: Process the JSON data and map it to the schema
    const addedProperties = [];
    for (const property of jsonData) {
      try {
        // Parse the amenities into an array of objects
        const amenities = property.amenities.split(";").map((category) => {
          const [title, items] = category.split(":");
          return {
            title: title.trim(),
            items: items.split(",").map((item) => item.trim()),
          };
        });

        // Parse room types into an array of objects
        const roomTypes = property.roomTypes.split(";").map((roomType) => {
          const [title, price] = roomType.split(":");
          return {
            title: title.trim(),
            price: parseFloat(price.trim()),
          };
        });

        // Create a new property document
        const newProperty = new Property({
          slug:
            property.title.toLowerCase().replace(/[\s]+/g, "-") + "-" + Date.now(),
          title: property.title,
          price: property.price,
          city: property.city,
          country: property.country,
          description: property.description,
          university: property.university,
          // images: property.images ? property.images.split(",") : [], // If images field is added in Excel
          area: property.area,
          services: property.services
            ? property.services.split(",").map((s) => s.trim())
            : [],
          amenities,
          roomTypes,
          // rating: property.rating || null,
        });

        // Save the property to the database
        const savedProperty = await newProperty.save();
        addedProperties.push(savedProperty);
      } catch (err) {
        console.error(
          `Error saving property "${property.title}":`,
          err.message
        );
      }
    }

    res.status(200).json({
      message: "Properties added successfully",
      addedProperties,
    });
  } catch (error) {
    console.error("Error processing Excel file:", error.message);
    res.status(500).json({ error: "Failed to process Excel file" });
  }
};

// Route for uploading Excel files
router.post(
  "/upload-excel",
  uploadExcel.single("file"),
  uploadExcelToCloudinary,
  (req, res) => {
    try {
      const cloudinaryResult = req.file.cloudinaryResult;

      if (!cloudinaryResult) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      res.status(200).json({
        message: "Excel file uploaded successfully",
        secure_url: cloudinaryResult.secure_url, // Cloudinary secure URL for the uploaded file
        public_id: cloudinaryResult.public_id, // Cloudinary public ID for the uploaded file
      });
    } catch (error) {
      console.error("Error uploading file:", error.message);
      res.status(500).json({ error: "Failed to upload file to Cloudinary" });
    }
  }
);

// Route to process the uploaded Excel file and add properties
router.post("/process-excel", processExcelFile);

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

router.put(
  "/property/:id",
  uploadImage.array("images", 5),
  async (req, res) => {
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
  }
);

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
// router.get("/properties/search", async (req, res) => {
//   const { city, country, title } = req.query; // Extract query parameters

//   try {
//     // Create a dynamic filter object based on the provided query parameters
//     const filter = {};
//     if (city) filter.city = { $regex: city, $options: "i" }; // Case-insensitive regex match
//     if (country) filter.country = { $regex: country, $options: "i" };
//     if (title) filter.title = { $regex: title, $options: "i" };

//     // Find properties matching the filter
//     const properties = await Property.find(filter);

//     if (properties.length === 0) {
//       return res.status(404).json({ message: "No properties found" });
//     }

//     res.status(200).json({
//       message: "Properties retrieved successfully",
//       properties,
//     });
//   } catch (error) {
//     console.error("Error searching properties:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

router.get("/properties/search", async (req, res) => {
  const { city, country, title } = req.query;
  const searchTerm = (city || country || title || '').toLowerCase();

  try {
    const filter = {
      $or: [
        { city: { $regex: searchTerm, $options: "i" } },
        { country: { $regex: searchTerm, $options: "i" } },
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } }
      ]
    };

    const properties = await Property.find(filter)
      .limit(20)
      .select('title city country price images type description')
      .lean();

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
