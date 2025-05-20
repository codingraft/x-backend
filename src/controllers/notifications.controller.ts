import { Response } from "express";
import Notification from "../models/notifications.model.js";

export const getAllNotifications = async (req: any, res: Response) => {
  const userId = req.user._id;
  try {
    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profilePicture",
    });
    if (!notifications) {
      return res.status(404).json({ message: "No notifications found" });
    }
    await Notification.updateMany({ to: userId }, { read: true });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get all notication error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteNotifications = async (req: any, res: Response) => {
  const userId = req.user._id;
  try {
    await Notification.deleteMany({ to: userId });
    res.status(200).json({ message: "Notifications deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
