import express from "express";
import { addAllowedStaff } from "./allowedStaff.controller.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { allowedStaffValidation } from "./allowedStaff.validation.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import expressAsyncHandler from "express-async-handler";
const router = express.Router();

// Add Allowed Staff Route
router.post(
    "/addAllowedMember",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(allowedStaffValidation),
    expressAsyncHandler(addAllowedStaff)
  );
export default router;
