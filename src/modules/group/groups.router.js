import express from "express";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";
import expressAsyncHandler from "express-async-handler";

import { activateGroup, addStudentToGroup, assignStaffToGroup, createGroup, deactivateGroup, deleteGroupFromSubject, getAllGroups, getAllGroupsUnderSubject, getAllStaffForGroup, getGroupById, getStudentsInGroup, removeAllStaffFromGroup, removeAllStudentsFromGroup, removeStaffFromGroup, removeStudentFromGroup, updateGroup } from "./groups.controller.js";
import { activateGroupValidation, addStudentValidationSchema, assignStaffToGroupValidation, createGroupValidation, deleteGroupFromSubjectValidation, getAllGroupsUnderSubjectValidation, getAllGroupsValidation, getAllStaffForGroupValidation, getGroupByIdValidation, getStudentsInGroupValidation, removeAllStaffFromGroupValidation, removeAllStudentsFromGroupValidation, removeStaffFromGroupValidation, removeStudentFromGroupValidation, updateGroupValidation, validateGroupId } from "./groups.validation.js";

const router = express.Router();

router.post(
    "/createGroup",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(createGroupValidation),
    expressAsyncHandler(createGroup) 
);

router.get(
    "/getAllGroups",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(getAllGroupsValidation),
    expressAsyncHandler(getAllGroups)
);

router.get(
    "/getGroupByID/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(getGroupByIdValidation),
    expressAsyncHandler(getGroupById)
);

router.put(
    "/updateGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(updateGroupValidation),
    expressAsyncHandler(updateGroup)
);

router.patch(
    "/deactivateGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(validateGroupId),
    expressAsyncHandler(deactivateGroup)
    
);

router.patch(
    "/activate/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(activateGroupValidation),
    expressAsyncHandler(activateGroup)
);


router.post(
    "/add-student",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(addStudentValidationSchema),
    expressAsyncHandler(addStudentToGroup)
);


router.delete(
    "/removeStudentFromGroup",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(removeStudentFromGroupValidation),
    expressAsyncHandler(removeStudentFromGroup)
  );

router.get(
    "/getStudentForGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(getStudentsInGroupValidation),
    expressAsyncHandler(getStudentsInGroup)
);



router.post(
    "/assignStaffToGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(assignStaffToGroupValidation),
    expressAsyncHandler(assignStaffToGroup)
  );


  router.delete(
    "/removeStaffFromGroup/:groupId/:staffId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(removeStaffFromGroupValidation),
    expressAsyncHandler(removeStaffFromGroup)
  );
  
  router.get(
    "/getStaffForGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(getAllStaffForGroupValidation),
    expressAsyncHandler(getAllStaffForGroup)
  );

  router.get(
    "/getAllGroupsForAsubject/:subjectId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF,systemRoles.STUDENT]),
    validationMiddleware(getAllGroupsUnderSubjectValidation),
    expressAsyncHandler(getAllGroupsUnderSubject)
  );
  
  router.delete(
    "/deleteGroupFromSubject/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(deleteGroupFromSubjectValidation),
    expressAsyncHandler(deleteGroupFromSubject)
  );


  router.delete(
    "/removeAllStudentsFromGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(removeAllStudentsFromGroupValidation),
    expressAsyncHandler(removeAllStudentsFromGroup)
  );

  router.delete(
    "/removeAllStaffFromGroup/:groupId",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(removeAllStaffFromGroupValidation),
    expressAsyncHandler(removeAllStaffFromGroup)
  );
  
export default router;