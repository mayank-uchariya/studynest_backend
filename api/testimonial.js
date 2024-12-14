import express from "express";
import Testimonial from "../schema/TestimonialSchema.js"; // Import the correct model

const router = express.Router();

// 1. Get all testimonials
router.get("/testimonials", async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});

router.get("/search", async (req, res) => {
    const { name } = req.query;
  
    if (!name) {
      return res.status(400).json({ message: "Name query parameter is required" });
    }
  
    try {
      // Using regex for case-insensitive search
      const testimonials = await Testimonial.find({
        name: { $regex: name, $options: "i" }, // Case-insensitive search
      });
  
      if (testimonials.length === 0) {
        return res.status(404).json({ message: "No testimonials found" });
      }
  
      res.json(testimonials);
    } catch (err) {
      res.status(500).json({ message: "Error searching testimonials" });
    }
});

// 2. Create a new testimonial
router.post("/testimonials", async (req, res) => {
    try {
        const { name, feedback, email } = req.body;

        // Check required fields
        if (!name || !feedback || !email) {
            return res.status(400).json({ error: "Name, feedback, and email are required" });
        }

        const newTestimonial = new Testimonial(req.body);
        const savedTestimonial = await newTestimonial.save();
        res.status(201).json(savedTestimonial);
    } catch (err) {
        // Handle duplicate email error
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(400).json({ error: "Failed to create testimonial", details: err.message });
    }
});

// 3. Delete a testimonial by email
router.delete("/testimonials/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get id from URL params

        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }

        const deletedTestimonial = await Testimonial.findByIdAndDelete(id);
        if (!deletedTestimonial) {
            return res.status(404).json({ error: "Testimonial not found for the provided ID" });
        }

        res.status(200).json({ message: "Testimonial deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete testimonial", details: err.message });
    }
});

export default router;
