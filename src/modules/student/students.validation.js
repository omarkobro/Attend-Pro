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

export const getAllStudentsValidation = {
  query: Joi.object({
    search: Joi.string().allow("", null),
    year: Joi.number().integer().min(1).max(6).messages({
      "number.base": "Year must be a number",
      "number.min": "Year must be at least 1",
      "number.max": "Year cannot exceed 6",
    }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

// export const getStudentNotificationsValidation = {
//   query: Joi.object({
//     type: Joi.string()
//       .valid("attendance", "warnings", "announcement", "system")
//       .optional(),
//     is_read: Joi.boolean().optional(),
//     page: Joi.number().integer().min(1).default(1),
//     limit: Joi.number().integer().min(1).max(50).default(10),
//   }),
// };