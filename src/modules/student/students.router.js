import express from "express";
import expressAsyncHandler from "express-async-handler";
import { getAllStudentsValidation, updateStudentSchema } from "./students.validation.js";
import { getAllStudents, getStudentProfile, getStudentSubjectsWithDetails, updateStudent } from "./student.controller.js";
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

router.get(
  "/getStudentProfile/:student_id?",
  auth,
  authorizeRole(["student", "admin"]),
  expressAsyncHandler(getStudentProfile)
);

router.get(
  "/getAllStudents",
  auth,
  authorizeRole(["admin", "staff"]),
  validationMiddleware(getAllStudentsValidation),
  expressAsyncHandler(getAllStudents)
);


// router.get(
//   "/getStudentNotifications",
//   auth,
//   authorizeRole(["student"]),
//   validationMiddleware(getStudentNotificationsValidation),
//   expressAsyncHandler(getStudentNotifications)
// );
export default router; 