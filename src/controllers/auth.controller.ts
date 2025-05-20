import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { GetMeRequest, LoginRequest, NewUserRequest } from "../types/types.js";
import { Request, Response } from "express";
import { generateToken } from "../utils/lib.js";

export const signUp = async (
  req: Request<{}, {}, NewUserRequest>,
  res: Response
) => {
  try {
    const { email, password, fullName, username } = req.body;

    if (!email || !password || !fullName || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create user

    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      username,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        username: newUser.username,
        followers: newUser.followers,
        following: newUser.following,
        profilePicture: newUser.profilePicture,
        bio: newUser.bio,
        coverPicture: newUser.coverPicture,
      });
    } else {
      return res.status(400).json({ message: "Invalid User Details" });
    }
  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    //send token
    generateToken(user._id, res);
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the JWT cookie
    res.cookie("jwt", "", {
      maxAge: 0, // Set maxAge to 0 to delete the cookie
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("Logout error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMe = (req: GetMeRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Get me error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};