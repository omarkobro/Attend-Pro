import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["attendance", "warnings", "announcement", "system"],
    required: true,
  },
  related_data: {
    type: Schema.Types.Mixed, // Can store additional relevant data (e.g., subject_id, attendance_id, etc.)
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
},{timestamps:true});

export default mongoose.models.Notification || model("Notification", notificationSchema);
