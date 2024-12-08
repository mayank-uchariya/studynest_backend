import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../schema/UserSchema.js"; // Import the User model

const router = express.Router();

// JWT Secret (use a strong secret and store it in `.env`)
const JWT_SECRET = process.env.JWT_SECRET;

const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error("Password is required for hashing");
    }

    // Generate a salt (10 is the salt rounds)
    const salt = await bcrypt.genSalt(10);

    // Check if salt is valid
    if (!salt) {
      throw new Error("Salt generation failed");
    }

    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!hashedPassword) {
      throw new Error("Password hashing failed");
    }

    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error; // rethrow to handle it in the route
  }
};

router.post("/signup", async (req, res) => {
  const { name, email, phone, password, university, nationality, gender } =
    req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // const dob = new Date(dateofBirth);

  // Calculate stay duration
  // const stayDuration = Math.ceil((new Date(moveOutDate) - new Date(moveInDate)) / (1000 * 60 * 60 * 24));

  try {
    // Create a new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      university,
      nationality,
      gender,
    });
    console.log(newUser);

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res
      .status(201)
      .json({ message: "User created successfully", token: token });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(user);

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

router.get("/user/:id", async (req, res) => {
  const userId = req.params.id; // Get user ID from route params
  console.log(userId);
  try {
    // Find user by ID
    const user = await User.findById(userId).select("-password"); // Exclude the password field
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.put("/user/:id", async (req, res) => {
  const userId = req.params.id;
  const updateData = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete User
router.delete("/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password field
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
