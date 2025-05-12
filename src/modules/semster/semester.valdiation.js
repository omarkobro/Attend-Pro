// validations/semesterValidation.js
import Joi from 'joi';

export const addSemesterValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "string.base": "Name must be a string.",
      "string.empty": "Semester name is required.",
    }),
    academicYear: Joi.string().trim().optional().messages({
      "string.base": "Academic year must be a string.",
    }),
    startDate: Joi.date().iso().required().messages({
      "date.base": "Start date must be a valid ISO date.",
      "any.required": "Start date is required.",
    }),
    endDate: Joi.date().iso().required().messages({
      "date.base": "End date must be a valid ISO date.",
      "any.required": "End date is required.",
    }),
    offWeeks: Joi.array()
      .items(Joi.number().integer().min(1).max(14))
      .unique()
      .optional()
      .messages({
        "array.base": "Off weeks must be an array of integers.",
        "array.unique": "Off weeks must not contain duplicates.",
      }),
    isCurrent: Joi.boolean().optional(),
  }),
};
