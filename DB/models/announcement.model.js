import mongoose, { model, Schema } from "mongoose";

const announcementSchema = new Schema({
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  }, { timestamps: true });
export default mongoose.models.Announcement || model('Announcement', announcementSchema)
