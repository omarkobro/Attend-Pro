import Staff from "../../../DB/models/staff.model.js";
import User from "../../../DB/models/user.model.js";
import AllowedStaff from "../../../DB/models/allowedStaff.model.js";
import GeneralSchedule from "../../../DB/models/generalSchedule.model.js";
import Group from "../../../DB/models/group.model.js";
import Department from "../../../DB/models/department.model.js";
import { AppError } from "../../utils/appError.js";


//=============== Get Staff Profile ========================
export const getStaffProfile = async (req, res, next) => {
    // 1. Extract query param `id` and logged-in user from request
    const { staffId } = req.params;

    // 3. Validate that `id` is provided
    if (!staffId) {
      return next(new AppError("Staff ID is required in params.", 400));
    }
  
    // 4. Fetch staff by ID and populate related fields
    const staff = await Staff.findById(staffId)
      .populate("user_id", "firstName lastName email university_email phoneNumber pfp")
      .populate("department", "name code")
      .populate("subjects", "name code");
  
    // 5. If not found, return 404
    if (!staff) {
      return next(new AppError("Staff not found", 404));
    }
  
    // 6. Return profile
    return res.status(200).json({ staff });
  };


//=============== Update Staff Profile (Admin Only) ========================
  export const updateStaffProfile = async (req, res, next) => {
    // 1. Extract staff ID from route params and requesting user
    const { id } = req.params;
    const requestingUser = req.authUser;
  
    // 2. Ensure requester is an admin
    if (requestingUser.role !== "admin") {
      return next(new AppError("Access denied. Admins only.", 403));
    }
  
    // 3. Find the staff document and populate user ref
    const staff = await Staff.findById(id).populate("user_id");
    if (!staff) {
      return next(new AppError("Staff not found", 404));
    }
  
    // 4. Destructure update fields from the request body
    const {
      staff_name,
      staff_number,
      position,
      department,
      firstName,
      lastName,
      phoneNumber,
      university_email
    } = req.body;
  
    // 5. Update Staff model fields if provided
    if (staff_name) staff.staff_name = staff_name;
    if (staff_number) staff.staff_number = staff_number;
    if (position) staff.position = position;
    if (department) staff.department = department;
  
    // 6. Update User model fields if provided
    if (firstName) staff.user_id.firstName = firstName;
    if (lastName) staff.user_id.lastName = lastName;
    if (phoneNumber) staff.user_id.phoneNumber = phoneNumber;
    if (university_email) staff.user_id.university_email = university_email;
  
    // 7. Save both user and staff
    await staff.user_id.save();
    await staff.save();
  
    // 8. Re-fetch the updated staff with required population
    const updatedStaff = await Staff.findById(id)
      .populate("user_id", "firstName lastName email university_email phoneNumber pfp")
      .populate("department", "name code")
      .populate("subjects", "name code");
  
    // 9. Return the updated profile
    return res.status(200).json({ staff: updatedStaff });
  };

//=============== Get All Staff (Admin Only) ========================
export const getAllStaff = async (req, res, next) => {
    // 1. Extract query params
    const {
      department,
      position,
      search,
      page = 1,
      limit = 10,
    } = req.query;
  
    // 2. Build query object
    const query = {};
  
    if (department) query.department = department;
    if (position) query.position = position;
  
    // 3. Handle keyword search
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { staff_name: regex },
        { staff_number: regex },
      ];
    }
  
    // 4. Count total documents
    const total = await Staff.countDocuments(query);
  
    // 5. Fetch staff with pagination and population
    const staff = await Staff.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user_id", "firstName lastName email university_email phoneNumber pfp")
      .populate("department", "name code")
      .sort({ createdAt: -1 });
  
    // 6. Return response
    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      staff,
    });
  };

//==================== delete staff member =================== 
export const deleteStaff = async (req, res, next) => {
    const { staffId } = req.params;
  
    // 1. Get the staff document
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new AppError("Staff not found", 404));
    }
  
    const userId = staff.user_id;
    const email = await User.findById(userId).then(user => user?.email);
  
    // === Store state for rollback ===
    const groupsWithStaff = await Group.find({ "staff.staff_id": staffId });
    const groupUpdatesBackup = groupsWithStaff.map(group => ({
      groupId: group._id,
      originalStaffArray: [...group.staff],
    }));
  
    // 2. Remove staff from all group.staff arrays
    const groupUpdatePromises = groupsWithStaff.map(group =>
      Group.updateOne(
        { _id: group._id },
        { $pull: { staff: { staff_id: staffId } } }
      )
    );
    const groupUpdateResults = await Promise.allSettled(groupUpdatePromises);
  
    const failedGroupUpdate = groupUpdateResults.find(r => r.status === "rejected");
    if (failedGroupUpdate) {
      // Rollback any successful updates
      const rollbackPromises = groupUpdatesBackup.map(backup =>
        Group.updateOne(
          { _id: backup.groupId },
          { $set: { staff: backup.originalStaffArray } }
        )
      );
      await Promise.all(rollbackPromises);
      return next(new AppError("Failed to update group associations. Rolled back.", 500));
    }
  
    // 3. Delete staff document
    const deletedStaff = await Staff.findByIdAndDelete(staffId);
    if (!deletedStaff) {
      // Rollback group updates
      const rollbackPromises = groupUpdatesBackup.map(backup =>
        Group.updateOne(
          { _id: backup.groupId },
          { $set: { staff: backup.originalStaffArray } }
        )
      );
      await Promise.all(rollbackPromises);
      return next(new AppError("Failed to delete staff. Rolled back.", 500));
    }
  
    // 4. Delete user account
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      // Rollback staff doc and groups
      await Staff.create(staff.toObject());
      await Promise.all(
        groupUpdatesBackup.map(backup =>
          Group.updateOne(
            { _id: backup.groupId },
            { $set: { staff: backup.originalStaffArray } }
          )
        )
      );
      return next(new AppError("Failed to delete user. Rolled back.", 500));
    }
  
    // 5. Remove from allowedStaff by email (if found)
    if (email) {
      await AllowedStaff.findOneAndDelete({ email });
    }
  
    return res.status(200).json({
      message: "Staff member deleted successfully and removed from all associations.",
    });
  };


//============================ get staff subjects with details ===========================
export const getStaffSubjectsWithDetails = async (req, res, next) => {
  // 1. Find the staff
  const staff = await Staff.findOne({ user_id: req.authUser._id }).lean();

  if (!staff) {
    return next(new AppError("Staff not found", 404));
  }

  // 2. Find all groups where this staff is assigned
  const groups = await Group.find({
    "staff.staff_id": staff._id,
    isDeleted: false,
  })
    .populate({
      path: "subject_id",
      populate: { path: "department" },
    })
    .lean();

  const responseData = [];

  for (const group of groups) {
    const subject = group.subject_id;

    if (!subject) {
      continue; // In case subject is deleted or not found
    }

    // Find this staff's role in the group
    const staffInfoInGroup = group.staff.find((s) =>
      s.staff_id.toString() === staff._id.toString()
    );

    const role = staffInfoInGroup?.role || null;

    // Get schedule by group name
    const generalSchedule = await GeneralSchedule.findOne({
      group_name: group.name,
    }).lean();

    let scheduleInfo = null;

    if (generalSchedule) {
      const subjectSchedule = generalSchedule.schedule.find((entry) =>
        entry.subject_id.toString() === subject._id.toString()
      );

      if (subjectSchedule) {
        scheduleInfo = {
          day: subjectSchedule.day,
          location: subjectSchedule.location || null,
        };
      }
    }

    responseData.push({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        department: subject.department?.name || null,
        year: subject.year,
      },
      group: {
        name: group.name,
      },
      role: role,
      schedule: scheduleInfo,
    });
  }

  res.status(200).json({
    status: "success",
    results: responseData.length,
    data: responseData,
  });
};