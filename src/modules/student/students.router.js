import express from "express";
import expressAsyncHandler from "express-async-handler";
import { updateStudentSchema } from "./students.validation.js";
import { getStudentSubjectsWithDetails, updateStudent } from "./student.controller.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";


const router = express.Router();

router.patch(
  "/update-student/:studentId",
  validationMiddleware(updateStudentSchema),
  expressAsyncHandler(updateStudent)
);

router.get(
  "/getSubjectForStudent",
  auth,
  authorizeRole(["student"]),
  expressAsyncHandler(getStudentSubjectsWithDetails)
);
export default router; 