import express, { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import expressAsyncHandler from "express-async-handler";
import { addSemester } from "./semester.controller.js";
import { addSemesterValidation } from "./semester.valdiation.js";

const router = Router();

router.post(
  '/setSemester',
  auth,
  authorizeRole(systemRoles.ADMIN),
  validationMiddleware(addSemesterValidation), 
  expressAsyncHandler(addSemester) 
);

export default router