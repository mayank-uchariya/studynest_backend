import express from 'express';
import Property, { propertySchema } from '../schema/PropertySchema.js';
import upload from '../utils/multer.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Method to increment views
propertySchema.methods.incrementViews = async function () {
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);

    // Reset views if last reset was more than a month ago
    if (this.lastViewedReset < oneMonthAgo) {
        this.views = 0;
        this.lastViewedReset = currentDate;
    }

    // Increment views
    this.views += 1;
    await this.save();
};


const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary', error);
    }
};

// Create a new property with image upload
router.post('/property', upload.array('images', 5), async (req, res) => {
    try {
        // Log the request for debugging
        console.log('Request files:', req.files);
        console.log('Request body:', req.body);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const propertyData = req.body;
        const imageUrls = req.files.map(file => file.path); // Use .path for Cloudinary URLs

        const newProperty = new Property({
            ...propertyData,
            images: imageUrls,
        });

        await newProperty.save();
        res.status(201).json({ message: 'Property created successfully', property: newProperty });
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/property/:id', upload.array('images', 5), async (req, res) => {
    const propertyId = req.params.id;
    const updateData = req.body;
    const imageUrls = req.files.map(file => file.secure_url);

    try {
        const property = await Property.findByIdAndUpdate(
            propertyId,
            { ...updateData, images: imageUrls },
            { new: true, runValidators: true }
        );
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        if (req.body.replaceImages === 'true') {
            // Optionally delete old images from Cloudinary
            for (let image of property.images) {
                const publicId = image.split('/').pop().split('.')[0];
                await deleteImageFromCloudinary(publicId);
            }
            property.images = imageUrls; // Replace images
        } else {
            property.images = [...property.images, ...imageUrls]; // Add new images
        }

        Object.assign(property, updateData);
        await property.save();
        res.status(200).json({ message: 'Property updated successfully', updatedProperty });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.delete('/property/:id', async (req, res) => {
    const propertyId = req.params.id;

    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Delete images from Cloudinary
        for (let image of property.images) {
            const publicId = image.split('/').pop().split('.')[0]; // Assuming the image URL contains the publicId
            await deleteImageFromCloudinary(publicId);
        }

        await Property.findByIdAndDelete(propertyId);
        res.status(200).json({ message: 'Property and images deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.get('/properties', async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
    try {
        const properties = await Property.find()
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Property.countDocuments();

        res.status(200).json({
            message: 'Properties retrieved successfully',
            properties,
            pagination: { total, page: Number(page), limit: Number(limit) },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/property/:id', async (req, res) => {
    const propertyId = req.params.id;

    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Increment the view count
        await property.incrementViews();

        res.status(200).json({ message: 'Property retrieved successfully', property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;

