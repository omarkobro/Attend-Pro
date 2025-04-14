import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const createSubjectValidation = {
  body: Joi.object({
      name: Joi.string().trim().required().messages({
          "string.empty": "Subject name is required.",
      }),
      code: Joi.string().trim().required().messages({
          "string.empty": "Subject code is required.",
      }),
      department: Joi.string().trim().required().custom(objectIdValidation).messages({
          "string.empty": "Department ID is required.",
      }),
      year: Joi.number().integer().min(1).max(5).required().messages({
          "number.base": "Year must be a valid number.",
          "number.min": "Year must be at least 1.",
          "number.max": "Year cannot exceed 10.",
      }),
  }),
};

export const updateSubjectValidation = {
  params: Joi.object({
      subjectId: Joi.string().trim().required().custom(objectIdValidation).messages({
          "string.empty": "Subject ID is required.",
      }),
  }),
  body: Joi.object({
      name: Joi.string().trim().optional(),
      code: Joi.string().trim().optional(),
      department: Joi.string().trim().optional().custom(objectIdValidation),
      year: Joi.number().integer().min(1).max(10).optional(),
  }),
};

export const activateSubjectValidation = {
    params: Joi.object({
        subjectId: Joi.string()
            .trim()
            .required()
            .custom(objectIdValidation)
            .messages({
                "string.empty": "Subject ID is required.",
            }),
    }),
};

export const deactivateSubjectValidation = {
    params: Joi.object({
        subjectId: Joi.string()
            .trim()
            .required()
            .custom(objectIdValidation)
            .messages({
                "string.empty": "Subject ID is required.",
            }),
    }),
};

export const getAllSubjectsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).messages({
      "number.base": "Page must be a number.",
      "number.min": "Page must be at least 1.",
    }),
    limit: Joi.number().integer().min(1).messages({
      "number.base": "Limit must be a number.",
      "number.min": "Limit must be at least 1.",
    }),
    department: Joi.string().trim().messages({
      "string.base": "Department must be a string.",
    }),
    year: Joi.number().integer().min(1).max(5).messages({
      "number.base": "Year must be a number.",
      "number.min": "Year must be at least 1.",
      "number.max": "Year cannot be more than 5.",
    }),
  }),
};

export const getSubjectByIdValidation = {
  params: Joi.object({
      subjectId: Joi.string()
          .trim()
          .custom(objectIdValidation)
          .required()
          .messages({
              "string.empty": "Subject ID is required.",
              "string.length": "Invalid Subject ID format.",
          }),
  }),
};


export const assignStaffValidation = {
  params: Joi.object({
    subjectId: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Subject ID is required.",
      }),
  }),

  body: Joi.object({
    staffId: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Staff ID is required.",
      }),
  }),
};


export const removeStaffFromSubjectValidation = {
  params: Joi.object({
    subjectId: Joi.string()
      .trim()
      .custom(objectIdValidation)
      .required()
      .messages({
        "string.empty": "Subject ID is required.",
        "string.pattern.base": "Invalid Subject ID format.",
      }),

    staffId: Joi.string()
      .trim()
      .custom(objectIdValidation)
      .required()
      .messages({
        "string.empty": "Staff ID is required.",
        "string.pattern.base": "Invalid Staff ID format.",
      }),
  }),
};


export const assignGroupValidation = {
  params: Joi.object({
    subjectId: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Subject ID is required.",
      }),
      groupId: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Group ID is required.",
      }),
  }),
};


export const removeGroupFromSubjectValidation = {
  params: Joi.object({
      subjectId: Joi.string()
          .trim()
          .required()
          .custom(objectIdValidation)
          .messages({
              "string.empty": "Subject ID is required.",
          }),
      groupId: Joi.string()
          .trim()
          .required()
          .custom(objectIdValidation)
          .messages({
              "string.empty": "Group ID is required.",
          }),
  }),
};
