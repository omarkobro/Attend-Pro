import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import { getGroupWeeklyAttendance } from "./attendance.controller.js";
import { getGroupWeeklyAttendanceSchema } from "./attendnace.validation.js";
import expressAsyncHandler from "express-async-handler";

const router = Router();

router.get(
    "/group/weekly/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getGroupWeeklyAttendanceSchema),
    expressAsyncHandler(getGroupWeeklyAttendance)
  );


// router.patch(
//   "/check-in",
//   validationMiddleware(checkInValidation), // Validate incoming request body
//   expressAsyncHandler(checkIn) // Handle the check-in logic
// );

// router.post(
//   "/check-out",
//   validationMiddleware(checkOutValidation),
//   expressAsyncHandler(checkOut)
// );
export default router;