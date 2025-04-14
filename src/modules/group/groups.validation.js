import Joi from "joi";
import { objectIdValidation } from "../../utils/generalValidation.js";

export const createGroupValidation = {
    body: Joi.object({
        name: Joi.string().trim().min(1).max(50).required()
            .messages({
                "string.empty": "Group name is required",
                "string.min": "Group name must be at least 1 characters",
                "string.max": "Group name must not exceed 50 characters",
            }),
    
        subject_id: Joi.custom(objectIdValidation).required()
            .messages({
                "any.required": "Subject ID is required",
            }),
    })
};

export const getAllGroupsValidation = {
    query: Joi.object({
        subject_code: Joi.string().trim().uppercase().optional().messages({
            "string.empty": "Subject code cannot be empty.",
        }),

        name: Joi.string().trim().min(2).max(50).optional().messages({
            "string.min": "Group name must be at least 2 characters.",
            "string.max": "Group name must not exceed 50 characters.",
        }),

        sortBy: Joi.string().valid("name", "createdAt", "updatedAt").optional().messages({
            "any.only": "Sort by can only be 'name', 'createdAt', or 'updatedAt'.",
        }),

        order: Joi.string().valid("asc", "desc").optional().messages({
            "any.only": "Order must be 'asc' or 'desc'.",
        }),

        page: Joi.number().integer().min(1).optional().messages({
            "number.base": "Page must be a number.",
            "number.min": "Page must be at least 1.",
        }),

        limit: Joi.number().integer().min(1).max(100).optional().messages({
            "number.base": "Limit must be a number.",
            "number.min": "Limit must be at least 1.",
            "number.max": "Limit cannot exceed 100.",
        }),
    }),
};

export const getGroupByIdValidation = {
    params: Joi.object({
        groupId:Joi.custom(objectIdValidation).required()
        .messages({
            "any.required": "Subject ID is required",
        }),
    }),
};


export const updateGroupValidation = {
    params: Joi.object({
        groupId: Joi.string().trim().required().messages({
            "string.empty": "Group ID is required.",
        }),
    }),
    body: Joi.object({
        name: Joi.string().trim().optional().messages({
            "string.empty": "Group name cannot be empty.",
        }),
    }).min(1).messages({
        "object.min": "At least one field must be updated.",
    }),
};


export const validateGroupId = {
    params: Joi.object({
        groupId: Joi.string().custom(objectIdValidation).required(),
    }),
};

export const activateGroupValidation = {
    params: Joi.object({
        groupId:Joi.custom(objectIdValidation).required()
        .messages({
            "any.required": "Subject ID is required",
        }),
    }),
};

export const addStudentValidationSchema = {
    body: Joi.object({
        groupId: Joi.custom(objectIdValidation).required(),
        studentId: Joi.custom(objectIdValidation).required(),
    }),
};

export const removeStudentFromGroupValidation = {
    body: Joi.object({
        group_id: Joi.custom(objectIdValidation).required(),
        student_id: Joi.custom(objectIdValidation).required(),
    }),
  };

  export const getStudentsInGroupValidation = {
    params: Joi.object({
      groupId: Joi.custom(objectIdValidation).required(),
    }),
  };

  export const assignStaffToGroupValidation = {
    params: Joi.object({
      groupId: Joi.custom(objectIdValidation).required(),
    }),
    body: Joi.object({
      staffId: Joi.custom(objectIdValidation).required(),
      role: Joi.string().valid("lecturer", "assistant_lecturer").required(),
    }),
  };

  export const removeStaffFromGroupValidation = {
    params: Joi.object({
      groupId: Joi.custom(objectIdValidation).required(),
      staffId: Joi.custom(objectIdValidation).required(),
    }),
  };


  export const getAllStaffForGroupValidation = {
    params: Joi.object({
      groupId: Joi.custom(objectIdValidation).required(),
    }),
  };


  export const getAllGroupsUnderSubjectValidation = {
    params: Joi.object({
      subjectId: Joi.custom(objectIdValidation).required(),
    }),
  };

  export const deleteGroupFromSubjectValidation = {
    params: Joi.object({
      groupId: Joi.custom(objectIdValidation).required(),
    }),
  };

  
export const removeAllStudentsFromGroupValidation = {
    params: Joi.object({
        groupId: Joi.custom(objectIdValidation).required(),
    }),
  };

export const removeAllStaffFromGroupValidation = {
  params: Joi.object({
    groupId: Joi.custom(objectIdValidation).required(),
}),
};