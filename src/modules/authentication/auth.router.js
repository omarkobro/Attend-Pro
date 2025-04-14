import { Router } from "express";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { refreshTokenValidation, resendVerificationValidation, studentSignUpValidation, verifyEmailValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, resendOTPValidation, staffSignUpValidation } from "./auth.validation.js";
import { multerMiddleHost } from "../../middlewares/multer.middleware.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import * as authController from "./auth.controller.js"
import expressAsyncHandler from "express-async-handler";


let router = Router();

router.post("/student/signUp",  multerMiddleHost(allowedExtensions.image).single("image"), validationMiddleware(studentSignUpValidation), expressAsyncHandler(authController.signUpStudent))

router.post("/staff/signUp",  multerMiddleHost(allowedExtensions.image).single("image"), validationMiddleware(staffSignUpValidation), expressAsyncHandler(authController.signUpStaff))

router.get(
    "/verify-account",
    validationMiddleware( verifyEmailValidation ), 
    expressAsyncHandler(authController.verifyAccount)
);

router.post(
    "/resend-verification",
    validationMiddleware(  resendVerificationValidation ), 
    expressAsyncHandler(authController.resendVerificationEmail)
);


router.post(
    "/login",
    validationMiddleware(loginValidation),
    expressAsyncHandler(authController.login)
);
router.post(
    "/refreshToken",
    validationMiddleware(refreshTokenValidation ),
    expressAsyncHandler(authController.refreshToken)
);
router.post(
    "/logout",
    validationMiddleware(refreshTokenValidation),
    expressAsyncHandler(authController.logout)
);
router.post(
    "/forgot-password",
    validationMiddleware(forgotPasswordValidation),
    expressAsyncHandler(authController.forgotPassword)
);
router.post(
    "/reset-password",
    validationMiddleware(resetPasswordValidation),
    expressAsyncHandler(authController.resetPassword)
);
router.post(
    "/resend-otp",
    validationMiddleware(resendOTPValidation),
    expressAsyncHandler(authController.resendOTP)
);





export default router 