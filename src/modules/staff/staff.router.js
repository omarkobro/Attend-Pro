import express from "express";
import expressAsyncHandler from "express-async-handler";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { deleteStaffValidation, getAllStaffValidation, getProfileValidation, updateStaffProfileValidation } from "./staff.validation.js";
import { deleteStaff, getAllStaff, getStaffProfile, updateStaffProfile } from "./staff.controller.js";
import { systemRoles } from "../../utils/systemRoles.js";



const router = express.Router();

router.get(
    "/getStaffProfile/:staffId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(getProfileValidation),
    expressAsyncHandler(getStaffProfile)
  );

  router.put(
    "/updateStaffProfile/:id",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(updateStaffProfileValidation),
    expressAsyncHandler(updateStaffProfile)
  );

  router.get(
    "/getAllStaff",
    auth, 
    authorizeRole([systemRoles.ADMIN]), 
    validationMiddleware(getAllStaffValidation), 
    expressAsyncHandler(getAllStaff)
  );

  router.delete(
    "/deleteStaff/:staffId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(deleteStaffValidation),
    expressAsyncHandler(deleteStaff)
  );
  
export default router; 