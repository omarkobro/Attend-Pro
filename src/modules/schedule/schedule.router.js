import express from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import expressAsyncHandler from "express-async-handler";
import { systemRoles } from "../../utils/systemRoles.js";
import { createGeneralSchedule, createUserSchedule, deleteGeneralSchedule, deleteUserSchedule, getAllGeneralSchedules, getUpcomingLectures, getUserSchedule, updateGeneralSchedule, updateUserSchedule } from "./schedule.controller.js";
import { createGeneralScheduleValidation, createUserScheduleValidation, deleteGeneralScheduleValidation, getAllGeneralSchedulesValidation, updateGeneralScheduleValidation, updateUserScheduleValidation } from "./schedule.validation.js";


const router = express.Router();

router.post(
  "/createGeneralSchedule",
  auth,
  authorizeRole([systemRoles.ADMIN]),
  validationMiddleware(createGeneralScheduleValidation),
  expressAsyncHandler(createGeneralSchedule)
);


router.put(
    "/updateGeneralSchedule",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(updateGeneralScheduleValidation),
    expressAsyncHandler(updateGeneralSchedule)
  );
  

  router.get(
    "/getAllSchedules",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF,systemRoles.STUDENT]),
    validationMiddleware(getAllGeneralSchedulesValidation),
    expressAsyncHandler(getAllGeneralSchedules)
  );

  router.delete(
    "/deleteGeneralSchedule/:schedule_id",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(deleteGeneralScheduleValidation),
    expressAsyncHandler(deleteGeneralSchedule)
  );
  
  router.post(
    "/createUserSchedule",
    auth,
    validationMiddleware(createUserScheduleValidation),
    expressAsyncHandler(createUserSchedule)
  );
  router.put(
    "/updateUserSchedule",
    auth,
    validationMiddleware(updateUserScheduleValidation),
    expressAsyncHandler(updateUserSchedule)
)

router.get("/get-user-schedule", auth, expressAsyncHandler(getUserSchedule));
router.get(
  "/upcoming-lectures",
  auth,
  expressAsyncHandler(getUpcomingLectures)
);

router.delete("/delete", auth, deleteUserSchedule);
export default router;