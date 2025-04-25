import Student from "../../../DB/models/student.model.js";
import User from "../../../DB/models/user.model.js";
import Warning from "../../../DB/models/warnings.model.js";
import Notification from "../../../DB/models/notification.model.js";
import GeneralSchedule from "../../../DB/models/generalSchedule.model.js";
import { AppError } from "../../utils/appError.js";
import mongoose from "mongoose";

export const updateStudent = async (req, res) => {
  const { studentId } = req.params;
  const { student_id, rfid_tag } = req.body;

  try {
    // Find student by their ID
    const student = await Student.findOne({ _id: studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update the student fields
    student.student_id = student_id;
    student.rfid_tag = rfid_tag;

    // Save the updated student document
    await student.save();

    return res.status(200).json({ message: "Student information updated successfully", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating student information" });
  }
};

//================ Get Student Subjects With Details ================================
export const getStudentSubjectsWithDetails = async (req, res, next) => {
  const student = await Student.findOne({ user_id: req.authUser._id })
    .populate({
      path: "groups",
      match: { isDeleted: false },
      populate: [
        {
          path: "subject_id",
          populate: { path: "department" },
        },
        {
          path: "staff.staff_id",
          select: "staff_name",
        },
      ],
    })
    .lean();

  if (!student) {
    return next(new AppError("Student not found", 404));
  }

  const responseData = [];

  for (const group of student.groups) {
    const subject = group.subject_id;
    const groupName = group.name;

    // Get schedule by group name
    const generalSchedule = await GeneralSchedule.findOne({
      group_name: groupName,
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
      instructors: group.staff.map((s) => ({
        id: s.staff_id._id,
        name: s.staff_id.staff_name,
        role: s.role,
      })),
      schedule: scheduleInfo,
    });
  }

  res.status(200).json({
    status: "success",
    results: responseData.length,
    data: responseData,
  });
};


//================== Get Student Profile =======================
export const getStudentProfile = async (req, res) => {
  let student;

  if (req.authUser.role === "admin" ||req.authUser.role === "staff" ) {
    const { student_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    student = await Student.findById(student_id)
      .populate("user_id", "firstName lastName email university_email phoneNumber pfp isVerified")
      .populate("department", "name code")
      .lean();
  } else {
    student = await Student.findOne({ user_id: req.authUser._id })
      .populate("user_id", "firstName lastName email university_email phoneNumber pfp isVerified")
      .populate("department", "name code")
      .lean();
  }

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const warnings = await Warning.find({ student: student._id })
    .populate("issued_by", "staff_name")
    .sort({ createdAt: -1 })
    .select("type message issued_by absenceCount createdAt")
    .lean();

  const response = {
    student: {
      _id: student._id,
      student_name: student.student_name,
      student_id: student.student_id,
      rfid_tag: student.rfid_tag,
      year: student.year,
      department: student.department || null,
      user: student.user_id
    },
    warnings: warnings.map(w => ({
      _id: w._id,
      type: w.type,
      message: w.message,
      absenceCount: w.absenceCount,
      issued_by: w.issued_by,
      createdAt: w.createdAt
    }))
  };

  res.status(200).json(response);
};

//================= get All Students ==================
export const getAllStudents = async (req, res) => {
  const { search, year, page = 1, limit = 10 } = req.query;

  const filter = {};

  // Filter by year if provided
  if (year) {
    filter.year = year;
  }

  // If search query exists
  if (search) {
    filter.$or = [
      { student_id: { $regex: search, $options: "i" } },
      { student_name: { $regex: search, $options: "i" } },
    ];
  }

  // Count total before pagination
  const total = await Student.countDocuments(filter);

  const students = await Student.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "user_id",
      select: "firstName lastName email phoneNumber pfp.secure_url",
      model: User,
    })
    .lean();

  res.status(200).json({
    total,
    page,
    limit,
    students,
  });
};

//==================== get Student Notifications ======================
// export const getStudentNotifications = async (req, res) => {
//   const { type, is_read, page = 1, limit = 10 } = req.query;

//   const filter = { recipient: req.authUser._id };

//   if (type) filter.type = type;
//   if (typeof is_read !== "undefined") filter.is_read = is_read;

//   const total = await Notification.countDocuments(filter);

//   const notifications = await Notification.find(filter)
//     .sort({ createdAt: -1 }) 
//     .skip((page - 1) * limit)
//     .limit(limit)
//     .lean();

//   res.status(200).json({
//     total,
//     page,
//     limit,
//     notifications,
//   });
// };