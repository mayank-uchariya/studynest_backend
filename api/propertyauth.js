import express from 'express';
import Property from '../schema/PropertySchema.js';
import upload from '../utils/multer.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary', error);
    }
};

// Create a new property with image upload
router.post('/property', upload.array('images', 5), async (req, res) => {
    const propertyData = req.body;
    if (!req.files) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => file.secure_url);

    try {
        const newProperty = new Property({
            ...propertyData,
            images: imageUrls,
        });

        await newProperty.save();
        res.status(201).json({ message: 'Property created successfully', property: newProperty });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.put('/property/:id', upload.array('images', 5), async (req, res) => {
    const propertyId = req.params.id;
    const updateData = req.body;
    const imageUrls = req.files.map(file => file.secure_url);

    try {
        const updatedProperty = await Property.findByIdAndUpdate(
            propertyId,
            { ...updateData, images: imageUrls },
            { new: true, runValidators: true }
        );

        if (!updatedProperty) {
            return res.status(404).json({ message: 'Property not found' });
        }

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
    try {
        const properties = await Property.find();
        res.status(200).json({ message: 'Properties retrieved successfully', properties });
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
        res.status(200).json({ message: 'Property retrieved successfully', property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});



export default router;

