import { Router } from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import expressAsyncHandler from "express-async-handler";
import { getStudentWarningsSchema, sendAcademicWarningSchema, sendTextWarningSchema } from "./warning.validation.js";
import { getMyWarnings, getStudentWarnings, sendAcademicWarning, sendTextWarning } from "./warning.controller.js";

const router = Router();

router.post(
    "/sendTextWarning",
    auth,
    authorizeRole([systemRoles.STAFF,systemRoles.ADMIN]),
    validationMiddleware(sendTextWarningSchema),
    expressAsyncHandler(sendTextWarning)
);

router.post(
    "/sendAcademicWarning",
    auth,
    authorizeRole([systemRoles.STAFF,systemRoles.ADMIN]),
    validationMiddleware(sendAcademicWarningSchema),
    expressAsyncHandler(sendAcademicWarning)
  );


  router.get(
    "/getWarningsForAstudent/student/:student_id",
    auth,
    authorizeRole([systemRoles.STAFF,systemRoles.ADMIN]),
    validationMiddleware(getStudentWarningsSchema),
    expressAsyncHandler(getStudentWarnings)
  );


  router.get(
    "/getMyWarnings",
    auth,
    authorizeRole([systemRoles.STUDENT]),
    expressAsyncHandler(getMyWarnings)
  );
export default router;