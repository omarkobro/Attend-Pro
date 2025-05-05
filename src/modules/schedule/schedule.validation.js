import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const createGeneralScheduleValidation = {
  body: Joi.object({
    year: Joi.number().integer().min(1).required().messages({
      "number.base": "Year must be a number",
      "number.min": "Year must be at least 1",
      "any.required": "Year is required",
    }),

    group_name: Joi.string().required().messages({
      "string.base": "Group name must be a string",
      "any.required": "Group name is required",
    }),

    schedule: Joi.array()
      .items(
        Joi.object({
          subject_id: Joi.string()
            .custom(objectIdValidation)
            .required()
            .messages({
              "any.required": "Subject ID is required",
            }),

          day: Joi.string()
            .valid(
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            )
            .required()
            .messages({
              "any.only": "Day must be a valid weekday",
              "any.required": "Day is required",
            }),

          startTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required()
            .messages({
              "string.pattern.base": "Start time must be in HH:MM format (24-hour)",
              "any.required": "Start time is required",
            }),

          endTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required()
            .messages({
              "string.pattern.base": "End time must be in HH:MM format (24-hour)",
              "any.required": "End time is required",
            }),

          sessionType: Joi.string()
            .valid("lecture", "lab", "tutorial")
            .required()
            .messages({
              "any.only": "Session type must be one of: lecture, lab, tutorial",
              "any.required": "Session type is required",
            }),

          location: Joi.string().optional(),
        }).custom((value, helpers) => {
          const [startHour, startMin] = value.startTime.split(":").map(Number);
          const [endHour, endMin] = value.endTime.split(":").map(Number);

          const startTotal = startHour * 60 + startMin;
          const endTotal = endHour * 60 + endMin;

          if (startTotal >= endTotal) {
            return helpers.message("End time must be after start time");
          }

          return value;
        }, "Time logic validation")
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one schedule entry is required",
        "any.required": "Schedule is required",
      }),
  }),
};


export const updateGeneralScheduleValidation = {
  body: Joi.object({
    schedule_id: Joi.string()
      .custom(objectIdValidation)
      .required()
      .messages({
        "any.required": "Schedule ID is required.",
        "string.base": "Schedule ID must be a string.",
        "string.empty": "Schedule ID cannot be empty.",
      }),

    year: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        "any.required": "Year is required.",
        "number.base": "Year must be a number.",
        "number.integer": "Year must be an integer.",
        "number.min": "Year must be at least 1.",
      }),

    schedule: Joi.array()
      .items(
        Joi.object({
          subject_id: Joi.string()
            .custom(objectIdValidation)
            .required()
            .messages({
              "any.required": "Subject ID is required.",
              "string.base": "Subject ID must be a string.",
              "string.empty": "Subject ID cannot be empty.",
            }),

          day: Joi.string()
            .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
            .required()
            .messages({
              "any.only": "Day must be one of: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.",
              "any.required": "Day is required.",
              "string.empty": "Day cannot be empty.",
            }),

          startTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required()
            .messages({
              "string.pattern.base": "Start time must be in HH:MM format (24-hour).",
              "any.required": "Start time is required.",
              "string.empty": "Start time cannot be empty.",
            }),

          endTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .required()
            .messages({
              "string.pattern.base": "End time must be in HH:MM format (24-hour).",
              "any.required": "End time is required.",
              "string.empty": "End time cannot be empty.",
            }),
            sessionType: Joi.string()
            .valid("lecture", "lab", "tutorial")
            .required()
            .messages({
              "any.only": "Session type must be one of: lecture, lab, tutorial",
              "any.required": "Session type is required",
            }),
          location: Joi.string().optional().messages({
            "string.base": "Location must be a string.",
          }),
        })
      )
      .min(1)
      .optional()
      .messages({
        "array.base": "Schedule must be an array of sessions.",
        "array.min": "Schedule must contain at least one session.",
      }),
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
      schedule: Joi.array().items(
        Joi.object({
          subject_id: Joi.string().custom(objectIdValidation).required().messages({
            "any.required": "Subject ID is required",
            "string.base": "Subject ID must be a valid string"
          }),
          day: Joi.string().valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday").required().messages({
            "any.required": "Day is required",
            "any.only": "Day must be a valid weekday"
          }),
          startTime: Joi.string().required().messages({
            "any.required": "Start time is required"
          }),
          endTime: Joi.string().required().messages({
            "any.required": "End time is required"
          }),
          location: Joi.string().required().messages({
            "any.required": "Location is required"
          }),
          sessionType: Joi.string().valid("lecture", "lab").required().messages({
            "any.required": "Session type is required",
            "any.only": "Session type must be either 'lecture' or 'lab'"
          })
        })
      ).min(1).required().messages({
        "array.base": "Schedule must be an array of schedule entries",
        "array.min": "Schedule must contain at least one entry"
      })
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