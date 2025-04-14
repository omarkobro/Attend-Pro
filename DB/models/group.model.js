import mongoose, { Schema, model } from "mongoose";

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  isDeleted: { type: Boolean, default: false },
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: "Student",
  }],
  staff: [{
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    role: {
      type: String,
      enum: ["lecturer", "assistant_lecturer"],
      required: true,
    },
  }],
}, { timestamps: true });

export default mongoose.models.Group || model("Group", groupSchema);
