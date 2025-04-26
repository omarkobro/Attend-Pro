import { Router } from "express";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import expressAsyncHandler from "express-async-handler";
import { systemRoles } from "../../utils/systemRoles.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { createAnnouncement, deleteAnnouncement, getGroupAnnouncements, getStudentAnnouncements } from "./announcement.controller.js";
import { createAnnouncementSchema, groupIdValidationSchema } from "./announcement.validation.js";


let router = Router();



router.post(
    "/createAnnouncement",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(createAnnouncementSchema),
    expressAsyncHandler(createAnnouncement)
  );
  


  router.get(
    "/getGroupAnnouncements/group/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]), 
    validationMiddleware(groupIdValidationSchema), 
    expressAsyncHandler(getGroupAnnouncements)
  );


  router.get(
    "/getStudentAnnouncements",
    auth,
    authorizeRole([systemRoles.STUDENT]), 
    expressAsyncHandler(getStudentAnnouncements)
  );


  router.delete(
    "/deleteAnnouncement/:announcementId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]), 
    expressAsyncHandler(deleteAnnouncement)
  );
  export default router;