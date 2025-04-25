import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";  


export const getProfileValidation = {
  params: Joi.object({
    staffId: Joi.string().custom(objectIdValidation).optional().messages({
      "string.base": "Staff ID must be a string",
      "any.custom": "Invalid staff ID",
    }),
  }),
};

export const updateStaffProfileValidation = {
    params: Joi.object({
      id: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Staff ID is required",
          "string.empty": "Staff ID cannot be empty",
        }),
    }),
    body: Joi.object({
      staff_name: Joi.string().optional().messages({
        "string.base": "Staff name must be a string",
      }),
      staff_number: Joi.string().optional().messages({
        "string.base": "Staff number must be a string",
      }),
      position: Joi.string()
        .valid("Lecturer", "Assistant-lecturer")
        .optional()
        .messages({
          "any.only": "Position must be either 'Lecturer' or 'Assistant-lecturer'",
        }),
      department: Joi.string()
        .custom(objectIdValidation)
        .optional()
        .messages({
          "string.base": "Department must be a valid ID",
        }),
      subjects: Joi.array()
        .items(Joi.string().custom(objectIdValidation))
        .optional()
        .messages({
          "array.base": "Subjects must be an array of valid IDs",
        }),
      firstName: Joi.string().optional().messages({
        "string.base": "First name must be a string",
      }),
      lastName: Joi.string().optional().messages({
        "string.base": "Last name must be a string",
      }),
      phoneNumber: Joi.string().optional().messages({
        "string.base": "Phone number must be a string",
      }),
      university_email: Joi.string().email().optional().messages({
        "string.email": "University email must be a valid email address",
      }),
    }),
  };

  export const getAllStaffValidation = {
    query: Joi.object().keys({
      department: Joi.string().optional(), 
      position: Joi.string().valid('Assistant-lecturer', 'Lecturer').optional(), 
      search: Joi.string().optional(), 
      page: Joi.number().integer().min(1).default(1), 
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  };

  export const deleteStaffValidation = {
    params: Joi.object({
      staffId: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "any.required": "Staff ID is required",
          "string.empty": "Staff ID cannot be empty",
          "string.custom": "Invalid Staff ID",
        }),
    }),
  };