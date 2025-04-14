import mongoose, { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    device: {
      type: Schema.Types.ObjectId,
      ref: "Device",
    },
    status: {
      type: String,
      enum: ["checked-in", "checked-in-pending", "attended", "pending", "absent"],
      default: "absent",
    },
    marked_by: {
      type: String,
      enum: ["rfid", "face_recognition", "manual"],
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    sessionDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ["lecture", "lab"],
    },
    approved: {
      type: String,
      enum: ["approved", "rejected", "unreviewed"],
      default: "unreviewed",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Attendance || model("Attendance", attendanceSchema);


