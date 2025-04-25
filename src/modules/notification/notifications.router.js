import express from "express";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
import { getUnreadNotificationCount, getUserNotifications, markAllNotificationsAsRead } from "./notifications.controller.js";
import { getNotificationsValidation  } from "./notifications.validation.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router = express.Router();


router.get(
    "/unread-count",
    auth,
    expressAsyncHandler(getUnreadNotificationCount)
  );

  router.get(
    "/getUserNotifications",
    auth, 
    validationMiddleware(getNotificationsValidation),
    expressAsyncHandler(getUserNotifications)
  );

//   router.patch(
//     "/notifications/:notificationId/read",
//     auth,
//     validationMiddleware(markAsReadValidation),
//     expressAsyncHandler(markNotificationAsRead)
//   );

  router.patch(
    "/mark-all-as-read",
    auth,
    expressAsyncHandler(markAllNotificationsAsRead)
  );
export default router; 