import express from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import {  activateSubject,   createSubject, deactivateSubject, getAllSubjects, getSubjectById, updateSubject } from "./subject.controller.js";
import { activateSubjectValidation, createSubjectValidation, deactivateSubjectValidation, getAllSubjectsValidation, getSubjectByIdValidation,  updateSubjectValidation } from "./subject.validation.js";
import expressAsyncHandler from "express-async-handler";

const router = express.Router();

router.post("/create-subject", auth, authorizeRole([systemRoles.ADMIN]), validationMiddleware(createSubjectValidation), expressAsyncHandler(createSubject) );

router.put("/update-subject/:subjectId", auth, authorizeRole([systemRoles.ADMIN]), validationMiddleware(updateSubjectValidation), expressAsyncHandler(updateSubject));

router.patch(
    "/activate/:subjectId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(activateSubjectValidation),
    expressAsyncHandler(activateSubject)
  );
  
  router.patch(
    "/deactivate/:subjectId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(deactivateSubjectValidation),
    expressAsyncHandler(deactivateSubject)
  );

router.get("/getAllSubjects", auth,  validationMiddleware(getAllSubjectsValidation), expressAsyncHandler(getAllSubjects));

router.get("/getSubjectById/:subjectId", auth,  validationMiddleware(getSubjectByIdValidation), expressAsyncHandler(getSubjectById)); 

// router.post("/assignStaffToSubject/:subjectId", auth, authorizeRole([systemRoles.ADMIN]),  validationMiddleware(assignStaffValidation), expressAsyncHandler(assignStaffToSubject)); 

// router.delete("/removeStaffFromSubject/:subjectId/:staffId", auth, authorizeRole([systemRoles.ADMIN]), validationMiddleware(removeStaffFromSubjectValidation), expressAsyncHandler(removeStaffFromSubject));

// router.post("/assignGroupToSubject/:subjectId/:groupId",auth,authorizeRole([systemRoles.ADMIN]),validationMiddleware(assignGroupValidation),
// expressAsyncHandler(assignGroupToSubject));

// router.delete("/removeGroupFromSubject/:subjectId/:groupId",auth,authorizeRole([systemRoles.ADMIN]),validationMiddleware(removeGroupFromSubjectValidation),expressAsyncHandler(removeGroupFromSubject));


export default router;