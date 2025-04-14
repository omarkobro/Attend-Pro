import mongoose, { Schema, model } from "mongoose";

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    isDeleted: { type: Boolean, default: false },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 5, 
    },
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Subject || model("Subject", subjectSchema);
