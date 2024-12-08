import express from "express";
import Property from "../schema/PropertySchema.js";
import upload from "../utils/multer.js";
import cloudinary from "../config/cloudinary.js";

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

// Create a new property with image upload
router.post("/property", upload.array("images", 5), async (req, res) => {
  try {
    // Log the request for debugging
    console.log("Request files:", req.files);
    console.log("Request body:", req.body);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const propertyData = req.body;

    // Parse amenities if it's a JSON string
    if (propertyData.amenities) {
      try {
        propertyData.amenities = new Map(
          Object.entries(JSON.parse(propertyData.amenities))
        );
      } catch (err) {
        return res.status(400).json({ message: "Invalid amenities format" });
      }
    }

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

router.put("/property/:id", upload.array("images", 5), async (req, res) => {
  const propertyId = req.params.id;
  const updateData = req.body;

  // Parse amenities if it's a string
  if (updateData.amenities && typeof updateData.amenities === "string") {
    try {
      updateData.amenities = JSON.parse(updateData.amenities);
    } catch (err) {
      return res.status(400).json({ message: "Invalid amenities data" });
    }
  }

  const imageUrls = req.files.map((file) => file.secure_url);

  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (req.body.replaceImages === "true") {
      // Optionally delete old images from Cloudinary
      for (let image of property.images) {
        const publicId = image.split("/").pop().split(".")[0];
        await deleteImageFromCloudinary(publicId);
      }
      property.images = imageUrls; // Replace images
    } else {
      property.images = [...property.images, ...imageUrls]; // Add new images
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

export default router;
