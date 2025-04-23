import Warning from "../../../DB/models/warnings.model.js";
import Student from "../../../DB/models/student.model.js";
import Staff from "../../../DB/models/staff.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Group from "../../../DB/models/group.model.js";
import Attendance from "../../../DB/models/attendance.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { AppError } from "../../utils/appError.js";


// ====================== send Text Warning ======================
export const sendTextWarning = async (req, res, next) => {
    const { student_id, message } = req.body;
    const staffId = req.authUser._id;
  
    const student = await Student.findById(student_id);
    if (!student) {
      return next(new AppError("Student not found", 404));
    }
  
    const warning = await Warning.create({
      student: student_id,
      type: "text",
      message,
      issued_by: staffId,
    });
  
    await Notification.create({
    recipient: student.user_id,
    type: "warnings",
    title: "New Warning Issued",
      message: "You’ve received a new warning related to your academic record. Tap to view details.",
    //   data: {
    //     warning_id: warning._id,
    //   },
    });
  
    // emitWarningEvent(warning);
  
    return res.status(201).json({
      message: "Warning sent successfully",
      data: warning,
    });
  };

//==================== Send Academic Warning API =========================
export const sendAcademicWarning = async (req, res, next) => {
    const { student_id, subject_id, group_id } = req.body;
    const { _id: staff_id } = req.authUser; 
    
    const staff = await Staff.findOne({ user_id: req.authUser._id });
    if (!staff) return next(new AppError("Staff not found", 404));

    // Fetch subject and check if it exists
    const subject = await Subject.findById(subject_id)
    
    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }
  
    // Fetch group and check if it exists
    const group = await Group.findById(group_id);
    if (!group) {
      return next(new AppError('Group not found', 404));
    }
  
    // Ensure the group is linked to the specified subject
    if (!subject.groups.includes(group_id)) {
      return next(new AppError('The provided group does not belong to the given subject', 400));
    }
  
    // Fetch student and ensure they are in the group
    const student = await Student.findById(student_id).populate('groups');
    if (!student) {
      return next(new AppError('Student not found', 404));
    }
    
    
    const studentInGroup = student.groups.some((group) => group.equals(group_id));
    if (!studentInGroup) {
      return next(new AppError('The student is not part of the specified group', 400));
    }
  
    // Calculate the absence count (you can modify this as needed based on your logic)
    const attendanceRecords = await Attendance.find({
      student: student_id,
      subject: subject_id,
      group: group_id,
      status: 'absent', 
    });
  
    const absenceCount = attendanceRecords.length;
  
    // Generate the warning message
    const warningMessage = `
      Academic Warning: You have been issued with an absence academic warning in the ${subject.name} group "${group.name}".
      Your current absence count is ${absenceCount} days.
      This warning has been issued by your instructor.
      Please contact your instructor or reach out for students adminstaration for more information.
    `;
    
    
    // Create the academic warning
    const warning = await Warning.create({
      student: student_id,
      type: 'academic',
      message: warningMessage,
      subject: subject_id,
      group: group_id,
      absenceCount,
      issued_by: staff._id
    });
        
    // Create the notification for the student
    await Notification.create({
      recipient: student.user_id,
      type: 'warnings',
      title: 'Academic Warning Issued',
      message: `You have received a new warning for the subject ${subject.name} (Group: ${group.name}).`,
    });
  
    return res.status(200).json({
      message: 'Academic warning sent successfully',
      data: {
        warning,
      },
    });
  };


  export const getStudentWarnings = async (req, res, next) => {
    const { student_id } = req.params;
  
    const warnings = await Warning.find({ student:student_id })
      .populate({
        path: "issued_by",
        select: "staff_name", 
      })
      .populate({
        path: "group",
        select: "name", 
      })
      .populate({
        path: "subject",
        select: "name", 
      });
  
    if (!warnings.length) {
      return next(new AppError("No warnings found for this student", 404));
    }
  
    res.status(200).json(warnings);
  };


  export const getMyWarnings = async (req, res, next) => {
    const { user_id } = req.authUser;
  
    // Fetch warnings for the currently authenticated student
    const warnings = await Warning.find({ student_id: user_id })
    .populate({
        path: "issued_by",
        select: "staff_name", 
      })
      .populate({
        path: "group",
        select: "name", 
      })
      .populate({
        path: "subject",
        select: "name", 
      });
  
    if (!warnings.length) {
      return next(new AppError("You have no warnings", 404));
    }
  
    res.status(200).json(warnings);
  };