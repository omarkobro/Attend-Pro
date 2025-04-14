import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const checkInValidation = {
  body: Joi.object({
    student_id: Joi.string().messages({
      "string.base": "Student ID must be a string",
    }),

    rfid_tag: Joi.string().messages({
      "string.base": "RFID tag must be a string",
    }),

    device_id: Joi.string().required().messages({
      "any.required": "Device ID is required",
      "string.base": "Device ID must be a string",
    }),

    marked_by: Joi.string()
      .valid("rfid", "face_recognition", "manual")
      .required()
      .messages({
        "any.required": "Marked by method is required",
        "any.only":
          "Marked by must be one of: 'rfid', 'face_recognition', or 'manual'",
      }),
  }),
};



export const checkOutValidation = {
  body: Joi.object({
    student_id: Joi.string().optional().messages({
      "string.base": "Student ID must be a string.",
    }),
    rfid_tag: Joi.string().optional().messages({
      "string.base": "RFID tag must be a string.",
    }),
    device_id: Joi.string().required().messages({
      "any.required": "Device ID is required.",
      "string.base": "Device ID must be a string.",
    }),
    marked_by: Joi.string().valid("rfid", "face_recognition", "manual").required().messages({
      "any.required": "Marked by is required.",
      "string.base": "Marked by must be one of 'rfid', 'face_recognition', or 'manual'.",
    }),
  }).or("student_id", "rfid_tag").messages({
    "object.missing": "Either student_id or rfid_tag must be provided.",
  }),
};
