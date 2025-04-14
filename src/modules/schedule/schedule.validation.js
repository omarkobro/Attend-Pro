import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const createGeneralScheduleValidation = {
    body: Joi.object({
      year: Joi.number().integer().min(1).required(),
      group_name: Joi.string().required(),
      schedule: Joi.array()
        .items(
          Joi.object({
            subject_id: Joi.string().custom(objectIdValidation).required(),
            day: Joi.string()
              .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              .required(),
            startTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // "HH:MM" format
              .required(),
            endTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // "HH:MM" format
              .required(),
            location: Joi.string().optional(),
          })
        )
        .min(1)
        .required(),
    }),
  };

export const updateGeneralScheduleValidation = {
    body: Joi.object({
      schedule_id: Joi.string().custom(objectIdValidation).required(),
      year: Joi.number().integer().min(1).required(),
      schedule: Joi.array()
        .items(
          Joi.object({
            subject_id: Joi.string().custom(objectIdValidation).required(),
            day: Joi.string()
              .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              .required(),
            startTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // "HH:MM" format
              .required(),
            endTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // "HH:MM" format
              .required(),
            location: Joi.string().optional(),
          })
        )
        .min(1)
        .optional()
    }),
  };

export const getAllGeneralSchedulesValidation = {
    query: Joi.object({
      year: Joi.number().integer().min(1).optional(),
      group_name: Joi.string().optional(),
    }),
  };

  export const deleteGeneralScheduleValidation = {
    params: Joi.object({
      schedule_id: Joi.custom(objectIdValidation).required(),
    }),
  };

  export const createUserScheduleValidation = {
    body: Joi.object({
      schedule: Joi.array()
        .items(
          Joi.object({
            subject_id: Joi.string().custom(objectIdValidation).required()
              .messages({ "any.required": "Subject ID is required", "any.custom": "Invalid Subject ID" }),
            day: Joi.string()
              .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              .required()
              .messages({ "any.required": "Day is required", "any.only": "Invalid day value" }),
            startTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
              .required()
              .messages({ "string.pattern.base": "Start time must be in HH:MM format", "any.required": "Start time is required" }),
            endTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
              .required()
              .messages({ "string.pattern.base": "End time must be in HH:MM format", "any.required": "End time is required" }),
            location: Joi.string().optional()
          })
        )
        .min(1)
        .required()
        .messages({ "array.min": "Schedule must contain at least one entry", "any.required": "Schedule array is required" })
    })
  };

  export const updateUserScheduleValidation = {
    body: Joi.object({
      schedule: Joi.array()
        .items(
          Joi.object({
            subject_id: Joi.string().custom(objectIdValidation).required().messages({
              "any.required": "Subject ID is required.",
              "string.base": "Subject ID must be a string.",
              "any.custom": "Invalid Subject ID format."
            }),
            day: Joi.string()
              .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              .required()
              .messages({
                "any.required": "Day is required.",
                "string.base": "Day must be a string.",
                "any.only": "Day must be a valid day of the week."
              }),
            startTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
              .required()
              .messages({
                "any.required": "Start time is required.",
                "string.pattern.base": "Start time must be in HH:MM format."
              }),
            endTime: Joi.string()
              .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
              .required()
              .messages({
                "any.required": "End time is required.",
                "string.pattern.base": "End time must be in HH:MM format."
              }),
            location: Joi.string().optional().messages({
              "string.base": "Location must be a string."
            })
          })
        )
        .min(1)
        .required()
        .messages({
          "any.required": "Schedule array is required.",
          "array.base": "Schedule must be an array.",
          "array.min": "At least one schedule entry is required."
        })
    })
  };