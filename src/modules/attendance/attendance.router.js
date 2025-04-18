import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { downloadGroupAttendance, getGroupWeeklyAttendance } from "./attendance.controller.js";
import { downloadAttendanceSchema, getGroupWeeklyAttendanceSchema } from "./attendnace.validation.js";
import expressAsyncHandler from "express-async-handler";

const router = Router();

router.get(
    "/group/weekly/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getGroupWeeklyAttendanceSchema),
    expressAsyncHandler(getGroupWeeklyAttendance)
  );

  router.get(
    "/group/:groupId/download",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(downloadAttendanceSchema),
    expressAsyncHandler(downloadGroupAttendance)
  );

export default router;