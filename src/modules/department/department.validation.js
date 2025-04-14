import Joi from "joi";

export const addDepartmentValidation = {
    body: Joi.object({
        name: Joi.string().trim().required(),
        code: Joi.string().trim().uppercase().required(),
    }),
};