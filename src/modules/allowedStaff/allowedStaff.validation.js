import Joi from "joi";
import { systemRoles } from "../../utils/systemRoles.js";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const allowedStaffValidation = {
  body: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Allows emails without enforcing TLDs
      .required()
      .messages({
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),

    role: Joi.string()
      .valid(systemRoles.STAFF, systemRoles.ADMIN)
      .default(systemRoles.STAFF)
      .messages({
        "any.only": `Role must be one of: ${systemRoles.STAFF}, ${systemRoles.ADMIN}.`,
      }),

    position: Joi.string()
      .valid("Assistant-lecturer", "Lecturer")
      .default("Lecturer")
      .messages({
        "any.only": "Position must be either 'Assistant-lecturer' or 'Lecturer'.",
      }),
    department : Joi.custom(objectIdValidation).required().messages({
      "any.required": "Department is required",
    }),
  }),
};
