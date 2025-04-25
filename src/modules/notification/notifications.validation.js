
import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

// export const markAsReadValidation = {
//   params: Joi.object({
//     notificationId: Joi.string().custom(objectIdValidation).required().messages({
//       "any.required": "Notification ID is required",
//       "string.empty": "Notification ID cannot be empty",
//     }),
//   }),
// };

export const getNotificationsValidation = {
    query: Joi.object({
      type: Joi.string()
        .valid("attendance", "warnings", "announcement", "system")
        .optional()
        .messages({
          "string.base": "Type must be a string",
          "any.only": "Type must be one of: attendance, warnings, announcement, system",
        }),
    }),
  };