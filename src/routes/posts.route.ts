import express from "express";
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from "../controllers/posts.controller.js";
import { protectedRoute } from "../middlewares/protectedRoute.js";


const router = express.Router();



router.post("/create", protectedRoute as any, createPost as any);
router.post("/comment/:id", protectedRoute as any, commentOnPost as any);
// router.put("/:id", protectedRoute, updatePost);
router.delete("/:id", protectedRoute as any, deletePost as any);
router.post("/like/:id", protectedRoute as any, likeUnlikePost as any);
router.get("/all", protectedRoute as any, getAllPosts as any);
router.get("/likes/:id", protectedRoute as any, getLikedPosts as any);
router.get("/following", protectedRoute as any, getFollowingPosts as any); 
router.get("/user/:username", protectedRoute as any, getUserPosts as any);
export default router;