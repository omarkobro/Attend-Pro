import express from "express";

import expressAsyncHandler from "express-async-handler";
import { addDepartment } from "./department.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { addDepartmentValidation } from "./department.validation.js";

const router = express.Router();

router.post(
    "/add-department",
    auth,
    authorizeRole(["admin"]), 
    validationMiddleware(addDepartmentValidation), 
    expressAsyncHandler(addDepartment)
);

export default router;
