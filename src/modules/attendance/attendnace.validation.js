import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

// export const checkInValidation = {
//   body: Joi.object({
//     student_id: Joi.string().messages({
//       "string.base": "Student ID must be a string",
//     }),

//     rfid_tag: Joi.string().messages({
//       "string.base": "RFID tag must be a string",
//     }),

//     device_id: Joi.string().required().messages({
//       "any.required": "Device ID is required",
//       "string.base": "Device ID must be a string",
//     }),

//     marked_by: Joi.string()
//       .valid("rfid", "face_recognition", "manual")
//       .required()
//       .messages({
//         "any.required": "Marked by method is required",
//         "any.only":
//           "Marked by must be one of: 'rfid', 'face_recognition', or 'manual'",
//       }),
//   }),
// };



// export const checkOutValidation = {
//   body: Joi.object({
//     student_id: Joi.string().optional().messages({
//       "string.base": "Student ID must be a string.",
//     }),
//     rfid_tag: Joi.string().optional().messages({
//       "string.base": "RFID tag must be a string.",
//     }),
//     device_id: Joi.string().required().messages({
//       "any.required": "Device ID is required.",
//       "string.base": "Device ID must be a string.",
//     }),
//     marked_by: Joi.string().valid("rfid", "face_recognition", "manual").required().messages({
//       "any.required": "Marked by is required.",
//       "string.base": "Marked by must be one of 'rfid', 'face_recognition', or 'manual'.",
//     }),
//   }).or("student_id", "rfid_tag").messages({
//     "object.missing": "Either student_id or rfid_tag must be provided.",
//   }),
// };



export const getGroupWeeklyAttendanceSchema = {
  params: Joi.object({
    groupId: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Group ID is required",
        "string.empty": "Group ID cannot be empty",
        "string.pattern.base": "Invalid Group ID format",
      }),
  }),
  query: Joi.object({
    week: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        "any.required": "Week number is required",
        "number.base": "Week number must be a number",
        "number.min": "Week number must be at least 1",
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        "number.base": "Page must be a number",
        "number.min": "Page must be at least 1",
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .default(10)
      .messages({
        "number.base": "Limit must be a number",
        "number.min": "Limit must be at least 1",
      }),
  }),
};

export const downloadAttendanceSchema = {
  params: Joi.object({
    groupId: Joi.string().custom(objectIdValidation).required().messages({
      "any.required": "Group ID is required",
      "string.empty": "Group ID is required",
    }),
  }),
  query: Joi.object({
    week: Joi.number().integer().min(1).required().messages({
      "any.required": "Week number is required",
      "number.base": "Week must be a number",
    }),
  }),
}