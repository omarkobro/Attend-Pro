import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";  

export const sendTextWarningSchema = {
    body: Joi.object({
      student_id: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Student ID is required",
          "string.empty": "Student ID cannot be empty",
          "any.custom": "Invalid student ID format",
        }),
      message: Joi.string()
        .max(500)
        .required()
        .messages({
          "any.required": "Message is required",
          "string.empty": "Message cannot be empty",
          "string.max": "Message must be at most 500 characters long",
        }),
    }),
  };

  export const sendAcademicWarningSchema = {
    body: Joi.object({
      student_id: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Student ID is required",
          "string.empty": "Student ID cannot be empty",
          "any.custom": "Invalid student ID format",
        }),
  
      subject_id: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Subject ID is required",
          "string.empty": "Subject ID cannot be empty",
          "any.custom": "Invalid subject ID format",
        }),
  
      group_id: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Group ID is required",
          "string.empty": "Group ID cannot be empty",
          "any.custom": "Invalid group ID format",
        }),
    }),
  };

export const getStudentWarningsSchema = {
    params: Joi.object({
      student_id: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Student ID is required",
        "string.base": "Student ID must be a string",
      }),
    }),
  };