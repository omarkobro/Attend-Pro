import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const createAnnouncementSchema = {
  body: Joi.object({
    content: Joi.string().trim().required().messages({
      "string.empty": "Announcement content is required",
      "any.required": "Announcement content is required",
    }),
    group: Joi.string().custom(objectIdValidation).required().messages({
      "string.empty": "Group ID is required",
      "any.required": "Group ID is required",
    }),
    subject: Joi.string().custom(objectIdValidation).required().messages({
      "string.empty": "Subject ID is required",
      "any.required": "Subject ID is required",
    }),
  }),
};


export const groupIdValidationSchema = Joi.object({
    params: Joi.object({
        groupId: Joi.string()
        .custom(objectIdValidation, "ObjectId validation")
        .required()
      }),
  });

  export const deleteAnnouncementValidation = Joi.object({
    announcementId: Joi.string().custom(objectIdValidation).required(),
  });