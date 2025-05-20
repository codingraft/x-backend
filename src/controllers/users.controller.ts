import { Request, Response } from "express";
import User from "../models/user.model.js";
import {v2 as cloudinary} from "cloudinary";
import {
  IUser,
  SuggestedProfileRequest,
  UpdateUserRequest,
  UserFollowUnfollowRequest,
} from "../types/types.js";
import Notification from "../models/notifications.model.js";
import bcrypt from "bcryptjs";

export const userProfile = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("User profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const followUnfollowProfile = async (
  req: UserFollowUnfollowRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user?._id);

    if (!userToModify || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (id === req.user?._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot follow/unfollow yourself" });
    }
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user?._id } });
      await User.findByIdAndUpdate(req.user?._id, { $pull: { following: id } });
      res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user?._id } });
      await User.findByIdAndUpdate(req.user?._id, { $push: { following: id } });

      const newNotification = new Notification({
        from: req.user?._id,
        to: id,
        type: "follow",
      });
      await newNotification.save();
      res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.log("Follow/Unfollow error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const suggestedProfile = async (
  req: SuggestedProfileRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe?.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));
    

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Suggested profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const updateProfile = async (req: UpdateUserRequest, res: any) => {
  const { username, fullName, email, currentPassword, newPassword, bio, link } =
  req.body;
  console.log("Update profile request body:", req.body);
  let {profilePicture, coverPicture} = req.body;
  const userId = req.user?._id;
  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (username) {
      const existingUser = await User.findOne({ username }) as IUser | null;
      if (existingUser && existingUser._id!.toString() !== userId) {
        return res.status(400).json({ message: "Username already exists" });
      }

    }
    if((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
      return res.status(400).json({ message: "Please provide both current and new password" });
    }
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password as string
      );
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if(newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }
    if (email) {
      const existingUser = await User.findOne({ email }) as IUser | null;
      if (existingUser && existingUser._id!.toString() !== userId) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }
    if (profilePicture) {
      if(user.profilePicture) {
        const publicId = user.profilePicture?.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      const uploadResponse = await cloudinary.uploader.upload(profilePicture);
      console.log("Upload response:", uploadResponse);
      profilePicture = uploadResponse.secure_url;
    }
    if (coverPicture) {
      if(user.coverPicture) {
        const publicId = user.coverPicture?.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      const uploadResponse = await cloudinary.uploader.upload(coverPicture);
      // user.coverPicture = coverPicture;
    }
    user.username = username || user.username;
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profilePicture = profilePicture || user.profilePicture;
    user.coverPicture = coverPicture || user.coverPicture;
    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log("Update profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
