import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Response } from "express";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI!);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export const generateToken = (userId: any, response: Response) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    response.cookie("jwt", token, {
        httpOnly: true, // prevent client-side JavaScript from accessing the cookie, also helps mitigate XSS attacks
        sameSite: "strict", // helps prevent CSRF attacks
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          secure: process.env.NODE_ENV === "production", // set to true if using HTTPS
    });
    return token;
}