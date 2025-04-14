import express from "express";
import { addAllowedStaff } from "./allowedStaff.controller.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { allowedStaffValidation } from "./allowedStaff.validation.js";

const router = express.Router();

// Add Allowed Staff Route
router.post("/addAllowedMember", validationMiddleware(allowedStaffValidation), addAllowedStaff);

export default router;
