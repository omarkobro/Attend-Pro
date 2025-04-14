import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";


export const createDeviceSchema = {
  body: Joi.object({
    device_id: Joi.string()
      .trim()
      .required()
      .messages({
        "string.base": "Device ID must be a string",
        "string.empty": "Device ID is required",
        "any.required": "Device ID is required"
      }),
    location: Joi.string()
      .trim()
      .required()
      .messages({
        "string.base": "Location must be a string",
        "string.empty": "Location is required",
        "any.required": "Location is required"
      })
  })
};


export const updateDeviceSchema = {
  params: Joi.object({
    id: Joi.string().custom(objectIdValidation).messages({
      "any.required": "Device ID is required in params"
    })
  }),
  body: Joi.object({
    location: Joi.string()
      .trim()
      .optional()
      .messages({
        "string.base": "Location must be a string"
      }),
    status: Joi.string()
      .valid("free", "reserved")
      .optional()
      .messages({
        "any.only": "Status must be either 'free' or 'reserved'"
      })
  }).min(1).messages({
    "object.min": "At least one field must be provided for update"
  })
};

export const deleteDeviceSchema = {
    params: Joi.object({
      id: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Device ID is required",
        "string.base": "Device ID must be a string"
      })
    })
};

export const getAllDevicesSchema = {
    query: Joi.object({
      location: Joi.string().optional().messages({
        "string.base": "Location must be a string"
      }),
      status: Joi.string()
        .valid("free", "reserved")
        .optional()
        .messages({
          "any.only": "Status must be either 'free' or 'reserved'"
        })
    })
};



export const getDeviceByIdSchema = {
    params: Joi.object({
      deviceId: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Device ID is required",
        "string.base": "Device ID must be a string"
      })
    })
};

export const selectDeviceSchema = {
    params: Joi.object({
      deviceId: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Device ID is required",
        "string.base": "Device ID must be a string",
      }),
    }),
    body: Joi.object({
      subjectId: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Subject ID is required",
        "string.base": "Subject ID must be a string",
      }),
      groupId: Joi.string().custom(objectIdValidation).required().messages({
        "any.required": "Group ID is required",
        "string.base": "Group ID must be a string",
      }),
      weekNumber: Joi.number().required().messages({
        "any.required": "Group ID is required",
      }),
      sessionType: Joi.string()
        .valid("lecture", "lab")
        .optional()
        .messages({
          "any.only": "Status must be either 'lecture' or 'lab'"
        })
    }),
};

export const cancelHallSelectionValidation = {
    params: Joi.object({
      deviceId: Joi.string()
        .custom(objectIdValidation)
        .required()
        .messages({
          "string.base": "Device ID must be a string",
          "any.required": "Device ID is required",
        }),
    }),
};

export const startCheckInValidation =  {
  params: Joi.object({
    deviceId: Joi.string().custom(objectIdValidation).required().messages({
      "any.required": "Device ID is required",
      "string.empty": "Device ID cannot be empty",
    }),
  }),
}


export const endCheckInValidation = {
  params: Joi.object({
    deviceId: Joi.string().custom(objectIdValidation).required().messages({
      "any.required": "Device ID is required",
      "string.empty": "Device ID cannot be empty",
    }),
  }),
}

export const startCheckOutValidation = {
  params: Joi.object({
    deviceId: Joi.string().custom(objectIdValidation).required().messages({
      "any.required": "Device ID is required",
      "string.empty": "Device ID cannot be empty",
    }),
  }),
};


export const endCheckOutValidation = {
  params: Joi.object({
    deviceId: Joi.string().custom(objectIdValidation).required().messages({
      "any.required": "Device ID is required",
      "string.empty": "Device ID cannot be empty",
    }),
  }),
};