import mongoose, { Schema, model } from "mongoose";

const userScheduleSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    // role: {
    //     type: String,
    //     enum: ["Student", "Staff"],
    //     required: true
    // },
    schedule: [
        {
            subject_id: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
            day: { type: String, enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
            startTime: { type: String, required: true }, // Format: "HH:MM"
            endTime: { type: String, required: true },   // Format: "HH:MM"
            location: { type: String } // e.g., Room 101, Lab A
        }
    ]
}, { timestamps: true });

export default mongoose.models.UserSchedule || model("UserSchedule", userScheduleSchema);
