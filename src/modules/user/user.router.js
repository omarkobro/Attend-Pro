import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import expressAsyncHandler from "express-async-handler"; 
import { getMyProfile } from "./user.controller.js";

const router = Router();

router.get(
  "/getUserProfile",
  auth, 
  expressAsyncHandler(getMyProfile)
);

export default router;