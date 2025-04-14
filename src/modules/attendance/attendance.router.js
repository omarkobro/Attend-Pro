import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import expressAsyncHandler from "express-async-handler";
import { checkInValidation, checkOutValidation } from './attendnace.validation.js';
// import { checkIn, checkOut } from './attendance.controller.js';

const router = Router();

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