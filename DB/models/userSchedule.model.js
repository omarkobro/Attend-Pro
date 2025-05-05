import mongoose, { Schema, model } from "mongoose";

const userScheduleSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    schedule: [
        {
            subject_id: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
            day: { type: String, enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
            sessionType: {type: String, enum: ["lecture", "lab"], required: true },
            startTime: { type: String, required: true }, // Format: "HH:MM"
            endTime: { type: String, required: true },   // Format: "HH:MM"
            location: { type: String } // e.g., Room 101, Lab A
        }
    ]
}, { timestamps: true });

export default mongoose.models.UserSchedule || model("UserSchedule", userScheduleSchema);


//   const userScheduleSchema = new Schema(
//     {
//       user: {
//         type: Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//         unique: true,
//       },
//       schedule: [
//         {
//           group_id: {
//             type: Schema.Types.ObjectId,
//             ref: "Group",
//             required: true,
//           },
//           subject_id: {
//             type: Schema.Types.ObjectId,
//             ref: "Subject",
//             required: true,
//           },
//           sessionType: {
//             type: String,
//             enum: ["lecture", "lab"],
//             required: true,
//           },
//           day: {
//             type: String,
//             enum: [
//               "sunday",
//               "monday",
//               "tuesday",
//               "wednesday",
//               "thursday",
//               "friday",
//               "saturday",
//             ],
//             required: true,
//           },
//           startTime: {
//             type: String,
//             required: true, // Format: "HH:mm"
//           },
//           endTime: {
//             type: String,
//             required: true, // Format: "HH:mm"
//           },
//           location: {
//             type: String,
//           },
//           source: {
//             type: String,
//             enum: ["manual", "university"],
//             default: "manual",
//           },
//         },
//       ],
//     },
//     { timestamps: true }
//   );
  
//   export default mongoose.models.UserSchedule ||
//     model("UserSchedule", userScheduleSchema);
  