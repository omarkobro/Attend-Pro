import mongoose, { Schema, model } from "mongoose";

const generalScheduleSchema = new Schema({
    year: {
        type: Number,
        required: true,
        min: 1
    },
    group_name: {
        type: String,
        required: true  
    },
    schedule: [
        {
            subject_id: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
            day: { type: String, enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
            startTime: { type: String, required: true }, // Format: "HH:MM"
            endTime: { type: String, required: true },   // Format: "HH:MM"
            location: { type: String} 
        }
    ]
}, { timestamps: true });

export default mongoose.models.GeneralSchedule || model("GeneralSchedule", generalScheduleSchema);