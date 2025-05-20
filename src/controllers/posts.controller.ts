import { Response } from "express";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notifications.model.js";

export const createPost = async (req: any, res: Response) => {
  try {
    const { text } = req.body;
    let { image } = req.body;
    const userId = req.user._id.toString();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Please provide text or image",
      });
    }
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      image = uploadResponse.secure_url;
    }
    const newPost = new Post({
      user: userId,
      text,
      image,
    });
    await newPost.save();

    res.status(201).json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    console.log("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deletePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }
    if (post.image) {
      const publicId = post.image.split("/").pop()?.split(".")[0];
      await cloudinary.uploader.destroy(publicId as string);
    }
    await Post.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const commentOnPost = async (req: any, res: Response) => {
  try {
    const { text } = req.body;
    const { id } = req.params;
    const userId = req.user._id.toString();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please provide text",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      user: userId,
      text,
    };
    post.comments.push(comment);
    await post.save();

    const updatedComments = post.comments;
    res.status(201).json(updatedComments);
  } catch (error) {
    console.log("Comment on post error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
 
export const likeUnlikePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    if (post.likes.includes(userId)) {
      await Post.updateOne({ _id: id }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: id } });
      const updatedLikes = post.likes.filter(
        (like) => like.toString() !== userId.toString()
      )
      return res.status(200).json(updatedLikes);
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: id } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      await notification.save();

      const updatedLikes = post.likes;
      return res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Like/Unlike post error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllPosts = async (req: any, res: Response) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.log("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getLikedPosts = async (req: any, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (likedPosts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json({
      success: true,
      data: likedPosts,
    });
  } catch (error) {
    console.log("Get liked posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getFollowingPosts = async (req: any, res: Response) => {
  try{
    const userId = req.user._id;
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const following = user.following;
    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
      // if (feedPosts.length === 0) {
      //   return res.status(200).json([]);
      // }
      res.status(200).json({
        success: true,
        data: feedPosts,
      });
  }
  catch (error) {
    console.log("Get following posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export const getUserPosts = async (req: any, res: Response) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json({
      success: true,
      data: posts,
    });
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};