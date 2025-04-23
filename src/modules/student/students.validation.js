import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";  

export const updateStudentSchema = {
  body: Joi.object({
    student_id: Joi.string()
      .trim()
      .required()
      .messages({
        "string.base": "Student ID must be a string",
        "string.empty": "Student ID is required",
        "any.required": "Student ID is required",
      }),

    rfid_tag: Joi.string()
      .trim()
      .required()
      .messages({
        "string.base": "RFID tag must be a string",
        "string.empty": "RFID tag is required",
        "any.required": "RFID tag is required",
      }),
  }),

  params: Joi.object({
    studentId: Joi.string()
      .custom(objectIdValidation)
      .messages({
        "any.required": "Student ID is required in params",
      }),
  }),
};





//   console.log("🔍 Getting student by user_id:", req.authUser._id);

//   const student = await Student.findOne({ user_id: req.authUser._id })
//     .populate({
//       path: "groups",
//       match: { isDeleted: false },
//       populate: [
//         {
//           path: "subject_id",
//           populate: { path: "department" },
//         },
//         {
//           path: "staff.staff_id",
//           select: "staff_name",
//         },
//       ],
//     })
//     .lean();

//   if (!student) {
//     console.log("❌ Student not found for user_id:", req.authUser._id);
//     return next(new AppError("Student not found", 404));
//   }

//   console.log("✅ Student found:", student.student_name);
//   console.log("🧩 Groups count:", student.groups?.length || 0);

//   const responseData = [];

//   for (const group of student.groups) {
//     console.log("➡️ Processing group:", group.name);

//     const subject = group.subject_id;
//     const groupName = group.name;

//     if (!subject) {
//       console.log("⚠️ No subject found in group:", groupName);
//       continue;
//     }

//     console.log("📘 Subject:", subject.name, "| Dept:", subject.department?.name);

//     // Get schedule by group name + year
//     const generalSchedule = await GeneralSchedule.findOne({
//       // year: student.year,
//       group_name: groupName,
//     }).lean();
    
//     let scheduleInfo = null;

//     if (generalSchedule) {
//       console.log("🗓️ General schedule found for group:", groupName);

//       const subjectSchedule = generalSchedule.schedule.find(
//         (entry) => {  
//           console.log("testing entries subject_id",entry.subject_id.toString());
//           console.log("testing  subject._id",subject._id.toString());
                  
//           return  entry.subject_id.toString() === subject._id.toString()
//         }
//       );

//       if (subjectSchedule) {
//         console.log("📅 Matching schedule found → Day:", subjectSchedule.day, "| Location:", subjectSchedule.location);
//         scheduleInfo = {
//           day: subjectSchedule.day,
//           location: subjectSchedule.location || null,
//         };
//       } else {
//         console.log("❌ No schedule entry found for subject:", subject.name);
//       }
//     } else {
//       console.log("❌ No general schedule found for group:", groupName);
//     }

//     responseData.push({
//       subject: {
//         id: subject._id,
//         name: subject.name,
//         code: subject.code,
//         department: subject.department?.name || null,
//         year: subject.year,
//       },
//       group: {
//         name: group.name,
//       },
//       instructors: group.staff.map((s) => ({
//         id: s.staff_id?._id,
//         name: s.staff_id?.staff_name,
//         role: s.role,
//       })),
//       schedule: scheduleInfo,
//     });
//   }

//   console.log("✅ Final result count:", responseData.length);

//   res.status(200).json({
//     status: "success",
//     results: responseData.length,
//     data: responseData,
//   });
// };