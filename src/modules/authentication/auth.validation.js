import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";


export const studentSignUpValidation = {
  body: Joi.object({
      firstName: Joi.string().trim().min(2).max(20).required().messages({
          "string.empty": "First name is required.",
          "string.min": "First name must be at least 2 characters.",
          "string.max": "First name must not exceed 20 characters.",
      }),
      lastName: Joi.string().trim().min(2).max(20).required().messages({
          "string.empty": "Last name is required.",
          "string.min": "Last name must be at least 2 characters.",
          "string.max": "Last name must not exceed 20 characters.",
      }),
      email: Joi.string().trim().email().required().messages({
          "string.empty": "Email is required.",
          "string.email": "Invalid email format.",
      }),
      university_email: Joi.string().trim().email().pattern(/^[a-zA-Z0-9._%+-]+@hti\.edu\.eg$/).optional().messages({
          "string.email": "Invalid university email format.",
      }),
      password: Joi.string().min(8).required().messages({
          "string.empty": "Password is required.",
          "string.min": "Password must be at least 8 characters long.",
      }),
      phoneNumber: Joi.string().trim().pattern(/^(010|011|012|015)\d{8}$/).required().messages({
          "string.empty": "Phone number is required.",
          "string.pattern.base": "Invalid phone number format.",
      }),
      rfid_tag: Joi.string().trim().optional().messages({
          "string.empty": "RFID tag must be a valid string.",
      }),
      OTP: Joi.string().optional().messages({
          "string.empty": "OTP must be a valid string.",
      }),
      expiresIn: Joi.date().optional().messages({
          "date.base": "Invalid expiration date format.",
      }),
      department : Joi.custom(objectIdValidation).messages({
        "any.required": "Department is required",
    }),
      year: Joi.number().integer().min(1).max(10).optional().messages({
          "number.base": "Year must be a valid number.",
          "number.min": "Year must be at least 1.",
          "number.max": "Year cannot exceed 10.",
      }),
  }),
};




export const staffSignUpValidation = {
  body: Joi.object({
      firstName: Joi.string().trim().min(2).max(20).required().messages({
          "string.empty": "First name is required.",
          "string.min": "First name must be at least 2 characters.",
          "string.max": "First name must not exceed 20 characters.",
      }),
      lastName: Joi.string().trim().min(2).max(20).required().messages({
          "string.empty": "Last name is required.",
          "string.min": "Last name must be at least 2 characters.",
          "string.max": "Last name must not exceed 20 characters.",
      }),
      email: Joi.string().trim().email().required().messages({
          "string.empty": "Email is required.",
          "string.email": "Invalid email format.",
      }),
      university_email: Joi.string().trim().email().pattern(/^[a-zA-Z0-9._%+-]+@hti\.edu\.eg$/).optional().messages({
          "string.email": "Invalid university email format.",
      }),
      password: Joi.string().min(8).required().messages({
          "string.empty": "Password is required.",
          "string.min": "Password must be at least 8 characters long.",
      }),
      phoneNumber: Joi.string().trim().pattern(/^(010|011|012|015)\d{8}$/).required().messages({
          "string.empty": "Phone number is required.",
          "string.pattern.base": "Invalid phone number format.",
      }),
      rfid_tag: Joi.string().trim().optional().messages({
          "string.empty": "RFID tag must be a valid string.",
      }),
      OTP: Joi.string().optional().messages({
          "string.empty": "OTP must be a valid string.",
      }),
      expiresIn: Joi.date().optional().messages({
          "date.base": "Invalid expiration date format.",
      }),
      department : Joi.custom(objectIdValidation).messages({
        "any.required": "Department is required",
    }),
  }),
};


export const verifyEmailValidation = {
  query: Joi.object({
    token: Joi.string().required().messages({
      "string.empty": "Verification token is required.",
    }),
  }),
};

export const resendVerificationValidation = {
  body: Joi.object({
    university_email: Joi.string()
      .trim()
      .email()
      .pattern(/^[a-zA-Z0-9._%+-]+@hti\.edu\.eg$/)
      .required()
      .messages({
        "string.empty": "University email is required.",
        "string.email": "Invalid university email format.",
      }),
  }),
};

export const loginValidation = {
  body: Joi.object({
    email: Joi.string()
      .trim()
      .email()
      .required()
      .messages({
        "string.empty": "Email is required.",
        "string.email": "Invalid email format.",
      }),

    password: Joi.string()
      .min(8)
      .required()
      .messages({
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 8 characters long.",
      }),
  }),
};

export const refreshTokenValidation = {
  cookies: Joi.object({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token is required.",
    }),
  }),
};



export const forgotPasswordValidation = {
    body: Joi.object({
        email: Joi.string().trim().email().required().messages({
            "string.empty": "Email is required.",
            "string.email": "Invalid email format.",
        }),
    }),
};


export const resetPasswordValidation = {
  body: Joi.object({
      email: Joi.string().trim().email().required().messages({
          "string.empty": "Email is required.",
          "string.email": "Invalid email format.",
      }),
      OTP: Joi.string().length(4).required().messages({
          "string.empty": "OTP is required.",
          "string.length": "OTP must be exactly 4 digits.",
      }),
      newPassword: Joi.string().min(8).required().messages({
          "string.empty": "New password is required.",
          "string.min": "Password must be at least 8 characters long.",
      }),
  }),
};


export const resendOTPValidation = {
  body: Joi.object({
    email: Joi.string()
      .trim()
      .email()
      .required()
      .messages({
        "string.empty": "Email is required.",
        "string.email": "Invalid email format.",
      }),
  }),
};