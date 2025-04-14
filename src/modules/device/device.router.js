import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import { cancelHallSelectionValidation, createDeviceSchema, deleteDeviceSchema, endCheckInValidation, endCheckOutValidation, getAllDevicesSchema, getDeviceByIdSchema, selectDeviceSchema, startCheckInValidation, startCheckOutValidation, updateDeviceSchema } from "./device.validation.js";
import { cancelHallSelection, createDevice, deleteDevice, endCheckInSession, endCheckOutSession, getAllDevices, getDeviceById, selectDevice, startCheckInSession, startCheckOutSession, updateDevice } from "./device.controller.js";
import { authorizeRole } from "../../middlewares/authorization.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/systemRoles.js";

const router = Router();

router.post(
  "/add-hall",
  auth,
  authorizeRole([systemRoles.ADMIN]),
  validationMiddleware(createDeviceSchema),
  expressAsyncHandler(createDevice)
);


router.put(
    "/update-device/:id",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(updateDeviceSchema),
    expressAsyncHandler(updateDevice)
);

router.delete(
    "/delete-device/:id",
    auth,
    authorizeRole([systemRoles.ADMIN]),
    validationMiddleware(deleteDeviceSchema),
    expressAsyncHandler(deleteDevice)
);



router.get(
    "/getAllHalls",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getAllDevicesSchema),
    expressAsyncHandler(getAllDevices)
);


router.get(
    "/getHallById/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(getDeviceByIdSchema),
    expressAsyncHandler(getDeviceById)
);

router.patch(
    "/selectHall/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(selectDeviceSchema),
    expressAsyncHandler(selectDevice)
);

router.patch(
    "/cancel-selection/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(cancelHallSelectionValidation),
    expressAsyncHandler(cancelHallSelection)
  );


router.patch(
    "/start-check-in/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN,systemRoles.STAFF]),
    validationMiddleware(startCheckInValidation),
    expressAsyncHandler(startCheckInSession)
);

router.patch(
    "/end-check-in/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(endCheckInValidation),
    expressAsyncHandler(endCheckInSession)
);

router.patch(
    "/start-check-out/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(startCheckOutValidation),
    expressAsyncHandler(startCheckOutSession)
);

router.patch(
    "/end-check-out/:deviceId",
    auth,
    authorizeRole([systemRoles.ADMIN, systemRoles.STAFF]),
    validationMiddleware(endCheckOutValidation),
    expressAsyncHandler(endCheckOutSession)
);
export default router;