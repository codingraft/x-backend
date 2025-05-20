import mongoose from "mongoose";

export interface Notification {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  type: string;
  read: boolean;
}

const notificationSchema = new mongoose.Schema<Notification>(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["follow", "like", "comment"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const Notification = mongoose.model<Notification>(
  "Notification",
  notificationSchema
);
export default Notification;
