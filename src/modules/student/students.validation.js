import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";  // Assuming you have this custom validation.

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