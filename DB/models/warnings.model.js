import mongoose, { Schema, model } from "mongoose";

const warningSchema = new Schema({
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "academic"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    absenceCount: {
      type: Number,
      required: function () {
        return this.type === "academic";
      },
    },
    issued_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  }, { timestamps: true });

export default mongoose.models.Warnings || model("Warning", warningSchema);
  