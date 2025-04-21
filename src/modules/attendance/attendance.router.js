import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { downloadGroupAttendance, getGroupWeeklyAttendance, getWeeklyAttendanceForGroup, updateAttendanceStatus } from "./attendance.controller.js";
import { downloadAttendanceSchema, getGroupWeeklyAttendanceSchema, getWeeklyAttendanceForGroupSchema, updateAttendanceStatusSchema } from "./attendnace.validation.js";
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

  router.patch(
    "/update-status/:attendanceId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(updateAttendanceStatusSchema),
    expressAsyncHandler(updateAttendanceStatus)
  );

  router.get(
    "/getWeeklyAttendanceForGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getWeeklyAttendanceForGroupSchema),
    expressAsyncHandler(getWeeklyAttendanceForGroup)
  );
export default router;