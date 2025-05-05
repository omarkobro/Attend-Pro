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
            sessionType: {type: String, enum: ["lecture", "lab"], required: true },
            startTime: { type: String, required: true }, // Format: "HH:MM"
            endTime: { type: String, required: true },   // Format: "HH:MM"
            location: { type: String}
        }
    ]
}, { timestamps: true });

export default mongoose.models.GeneralSchedule || model("GeneralSchedule", generalScheduleSchema);


// const generalScheduleSchema = new Schema(
//     {
//       group_id: {
//         type: Schema.Types.ObjectId,
//         ref: "Group",
//         required: true,
//       },
//       subject_id: {
//         type: Schema.Types.ObjectId,
//         ref: "Subject",
//         required: true,
//       },
//       sessionType: {
//         type: String,
//         enum: ["lecture", "lab"],
//         required: true,
//       },
//       year: {
//           type: Number,
//           required: true,
//           min: 1,
//           max: 5,
//         },
//       day: {
//         type: String,
//         enum: [
//           "sunday",
//           "monday",
//           "tuesday",
//           "wednesday",
//           "thursday",
//           "friday",
//           "saturday",
//         ],
//         required: true,
//       },
//       startTime: {
//         type: String,
//         required: true, // Format: "HH:mm"
//       },
//       endTime: {
//         type: String,
//         required: true, // Format: "HH:mm"
//       },
//       location: {
//         type: String,
//       },
//       source: {
//         type: String,
//         enum: ["manual", "university"],
//         default: "manual",
//       },
//     },
//     { timestamps: true }
//   );
  