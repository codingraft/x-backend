import { Response } from "express";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notifications.model.js";

// Helper function to limit comments in posts
const limitCommentsInPosts = (posts: any[]) => {
  return posts.map(post => {
    const postObj = post.toObject();
    return {
      ...postObj,
      comments: postObj.comments.slice(0, 3),
      totalComments: postObj.comments.length,
      hasMoreComments: postObj.comments.length > 3
    };
  });
};

// Helper function to populate post data
const getPopulateOptions = () => [
  {
    path: "user",
    select: "-password",
  },
  {
    path: "comments.user",
    select: "-password",
  }
];

// Helper function to get pagination params
const getPaginationParams = (req: any) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Helper function to create pagination response
const createPaginationResponse = (total: number, page: number, limit: number, skip: number, dataLength: number) => {
  const hasMore = skip + dataLength < total;
  return {
    page,
    limit,
    total,
    hasMore,
  };
};

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

    // Populate the newly added comment and return only first 3
    await post.populate({
      path: "comments.user",
      select: "-password",
    });

    const postObj = post.toObject();
    const limitedComments = postObj.comments.slice(0, 3);

    res.status(201).json({
      comments: limitedComments,
      totalComments: postObj.comments.length,
      hasMoreComments: postObj.comments.length > 3
    });
  } catch (error) {
    console.log("Comment on post error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getPostComments = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const post = await Post.findById(id).populate({
      path: "comments.user",
      select: "-password",
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const postObj = post.toObject();
    const comments = postObj.comments.slice(skip, skip + limit);
    const hasMore = skip + limit < postObj.comments.length;

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        skip,
        limit,
        total: postObj.comments.length,
        hasMore,
      },
    });
  } catch (error) {
    console.log("Get post comments error:", error);
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
    const { page, limit, skip } = getPaginationParams(req);

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getPopulateOptions());

    const postsWithLimitedComments = limitCommentsInPosts(posts);
    const totalPosts = await Post.countDocuments();
    const pagination = createPaginationResponse(totalPosts, page, limit, skip, posts.length);

    res.status(200).json({
      success: true,
      data: postsWithLimitedComments,
      pagination,
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

    const { page, limit, skip } = getPaginationParams(req);

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getPopulateOptions());

    const postsWithLimitedComments = limitCommentsInPosts(likedPosts);
    const totalPosts = user.likedPosts.length;
    const pagination = createPaginationResponse(totalPosts, page, limit, skip, likedPosts.length);

    res.status(200).json({
      success: true,
      data: postsWithLimitedComments,
      pagination,
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
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { page, limit, skip } = getPaginationParams(req);
    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getPopulateOptions());

    const postsWithLimitedComments = limitCommentsInPosts(feedPosts);
    const totalPosts = await Post.countDocuments({ user: { $in: following } });
    const pagination = createPaginationResponse(totalPosts, page, limit, skip, feedPosts.length);

    res.status(200).json({
      success: true,
      data: postsWithLimitedComments,
      pagination,
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

		const { page, limit, skip } = getPaginationParams(req);

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate(getPopulateOptions());

		const postsWithLimitedComments = limitCommentsInPosts(posts);
		const totalPosts = await Post.countDocuments({ user: user._id });
		const pagination = createPaginationResponse(totalPosts, page, limit, skip, posts.length);

		res.status(200).json({
      success: true,
      data: postsWithLimitedComments,
      pagination,
    });
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};