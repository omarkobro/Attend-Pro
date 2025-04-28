import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { acceptAllPendingStudents, downloadGroupAttendance, getAttendanceResultsForSession, getGroupAnalytics, getGroupWeeklyAttendance, getStudentAttendanceHistory, getSystemAnalytics, getWeeklyAttendanceForGroup, rejectAllPendingStudents, updateAttendanceStatus } from "./attendance.controller.js";
import { acceptAllPendingStudentsSchema, downloadAttendanceSchema, getAttendanceHistorySchema, getGroupAnalyticsSchema, getGroupWeeklyAttendanceSchema, getSessionResultValidation, getWeeklyAttendanceForGroupSchema, rejectAllPendingStudentsSchema, systemAnalyticsValidation, updateAttendanceStatusSchema } from "./attendnace.validation.js";
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


  router.get(
    "/getAttendanceResultsForSession/group/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]), 
    validationMiddleware(getSessionResultValidation),
    expressAsyncHandler(getAttendanceResultsForSession)
  );

  router.patch(
    "/acceptAllPendingStudents/group/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(acceptAllPendingStudentsSchema),
    expressAsyncHandler(acceptAllPendingStudents)
  );

  router.patch(
    "/rejectAllPendingStudents/group/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(rejectAllPendingStudentsSchema),
    expressAsyncHandler(rejectAllPendingStudents)
  );
 
  router.get(
    "/getStudentAttendanceHistory/student/:studentId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STUDENT]),
    validationMiddleware(getAttendanceHistorySchema),
    expressAsyncHandler(getStudentAttendanceHistory)
  );

  router.get(
    "/getGroupAnalytics/group/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getGroupAnalyticsSchema),
    expressAsyncHandler(getGroupAnalytics)
  );
  
  router.get(
    "/getSystemAnalytics",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(systemAnalyticsValidation),
    expressAsyncHandler(getSystemAnalytics) 
  );
export default router;