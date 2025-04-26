import Announcement from "../../../DB/models/announcement.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Notification from "../../../DB/models/notification.model.js";
import Staff from "../../../DB/models/staff.model.js";
import Student from "../../../DB/models/student.model.js";
import { AppError } from "../../utils/appError.js";

//=================== create Announcement ====================
export const createAnnouncement = async (req, res, next) => {
    const { content, group: groupId, subject: subjectId } = req.body;
    const userId = req.authUser._id;

    // 1. Get staff document linked to this user
    const staff = await Staff.findOne({ user_id: userId });
    if (!staff) {
      return next(new AppError("Staff profile not found", 404));
    }

    // 2. Check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new AppError("Subject not found", 404));
    }

    // 3. Check if the group exists and is not deleted
    const group = await Group.findOne({ _id: groupId, isDeleted: false }).populate("students");
    if (!group) {
      return next(new AppError("Group not found or has been deleted", 404));
    }

    // 4. Check if the group is associated with the provided subject
    if (!group.subject_id.equals(subject._id)) {
      return next(new AppError("This group is not associated with the provided subject", 400));
    }

    // 5. Check if the staff member is assigned to this group
    const isStaffInGroup = group.staff.some(
      (s) => s.staff_id.toString() === staff._id.toString()
    );

    if (!isStaffInGroup) {
      return next(new AppError("You are not assigned to this group", 403));
    }

    // 6. Create announcement
    const announcement = await Announcement.create({
      content,
      createdBy: staff._id,
      subject: subjectId,
      group: groupId,
    });

    // 7. Send notifications to the students in the group
    const students = await Student.find({ _id: { $in: group.students } }).populate("user_id");

    if (students.length > 0) {
      const notifications = students.map((student) => ({
        recipient: student.user_id._id,
        title: "New Announcement",
        message: content.slice(0, 100),
        type: "announcement",
        related_data: {
          announcement_id: announcement._id,
          group_id: groupId,
          subject_id: subjectId,
        },
      }));

      await Notification.insertMany(notifications);
    }

    // 8. Return success response with announcement data
    res.status(201).json({
      message: "Announcement created and notifications sent",
      announcement,
    });
};

//=================== Get Group Announcements ====================
export const getGroupAnnouncements = async (req, res, next) => {
    const userId = req.authUser._id;  

    // 1. Find the staff member by userId (since authUser is a user, not staff directly)
    const staff = await Staff.findOne({ user_id: userId });
    if (!staff) {
      return next(new AppError("Staff not found", 404));
    }
  
    const staffId = staff._id;  
    const { groupId } = req.params;
  
    // 2. Check if the group exists and is not deleted
    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) {
      return next(new AppError("Group not found or has been deleted", 404));
    }
  
    // 3. Check if the staff is assigned to this group
    const isStaffInGroup = group.staff.some(
      (s) => s.staff_id.toString() === staffId.toString()
    );
  
    if (!isStaffInGroup) {
      return next(new AppError("You are not assigned to this group", 403));
    }
  
    // 4. Fetch announcements for the group (from any staff), sorted by latest
    const announcements = await Announcement.find({
      group: groupId,
      isDeleted: false,
    })
      .populate({
        path: "createdBy",
        select: "staff_name",  
      })
      .populate({
        path: "subject",
        select: "name code",  
      })
      .sort({ createdAt: -1 });
  
    // 5. Send response with the announcements
    res.status(200).json(announcements);
  };


//=================== Get Student Announcements ====================
export const getStudentAnnouncements = async (req, res, next) => {
    const userId = req.authUser._id;  
    // 1. Find the student by userId (since authUser is a user, not student directly)
    const student = await Student.findOne({ user_id: userId });
    if (!student) {
      return next(new AppError("Student not found", 404));
    }
  
    const { studentId } = student._id; 
    // 2. Fetch groups the student is associated with
    const groups = student.groups;
    if (groups.length === 0) {
      return next(new AppError("Student is not part of any group", 404));
    }
  
    // 3. Fetch announcements for the groups the student is part of
    const announcements = await Announcement.find({
      group: { $in: groups },
      isDeleted: false,
    })
      .populate({
        path: "createdBy",
        select: "staff_name",  
      })
      .populate({
        path: "subject",
        select: "name code", 
      })
      .sort({ createdAt: -1 });
  
    // 4. Send response with the announcements
    res.status(200).json(announcements);
  };

//===================== Delete Announcement API ======================

// Controller to delete an announcement
export const deleteAnnouncement = async (req, res, next) => {
    const { announcementId } = req.params;
    const userId = req.authUser._id; 
  
    // 1. Check if the announcement exists
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }
  
    // 2. Check if the user is authorized to delete the announcement
    const isAdmin = req.authUser.role === 'admin'; 
    const isOwner = announcement.createdBy.toString() === userId.toString(); 
    
    if (!isAdmin && !isOwner) {
      return next(new AppError("You are not authorized to delete this announcement", 403));
    }
  
    // 3. Soft Delete or Hard Delete
    // Soft delete: we mark the announcement as deleted without actually removing it from the DB
    announcement.isDeleted = true;
    await announcement.save();
  
    // Optionally, you can hard delete by uncommenting the line below:
    // await announcement.remove();
  
    // 4. Send response
    res.status(200).json({
      message: "Announcement deleted successfully",
      announcement
    });
  };