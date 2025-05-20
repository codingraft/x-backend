import express from "express";

import { protectedRoute } from "../middlewares/protectedRoute.js";
import { followUnfollowProfile, suggestedProfile, updateProfile, userProfile } from "../controllers/users.controller.js";
const router = express.Router();

router.get("/profile/:username", protectedRoute as any, userProfile as any);
router.get("/suggested", protectedRoute as any, suggestedProfile as any);
router.post("/follow/:id", protectedRoute as any, followUnfollowProfile as any);
router.post("/update", protectedRoute as any, updateProfile as any);

export default router;
