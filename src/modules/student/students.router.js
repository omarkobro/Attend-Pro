import express from "express";

import expressAsyncHandler from "express-async-handler";
import { updateStudentSchema } from "./students.validation.js";
import { updateStudent } from "./student.controller.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = express.Router();

router.patch(
  "/update-student/:studentId",
  validationMiddleware(updateStudentSchema),
  expressAsyncHandler(updateStudent)
);

export default router; 