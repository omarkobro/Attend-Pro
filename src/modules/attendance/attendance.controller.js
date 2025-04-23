import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Staff from "../../../DB/models/staff.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";
import { generateAttendancePDF } from "../../utils/pdfkit.js";
import { AppError } from "../../utils/appError.js";

//===================== Get Group Weekly Attendance =========================
// export const getGroupWeeklyAttendance = async (req, res) => {
//     const { groupId } = req.params;
//     const { week, page = 1, limit = 10 } = req.query;
  
//     const numericPage = parseInt(page);
//     const numericLimit = parseInt(limit);
  
//     // 1. Fetch the group and its subject
//     const group = await Group.findById(groupId)
//       .populate("subject_id", "name")
//       .lean();
  
//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }
  
//     const subject = group.subject_id;
//     const studentIds = group.students;
  
//     // 2. Pagination calculation
//     const totalStudents = studentIds.length;
//     const totalPages = Math.ceil(totalStudents / numericLimit);
//     const skip = (numericPage - 1) * numericLimit;
  
//     const paginatedStudentIds = studentIds.slice(skip, skip + numericLimit);
  
//     // 3. Fetch student details
//     const students = await Student.find({ _id: { $in: paginatedStudentIds } })
//       .populate("user_id", "firstName lastName")
//       .lean();
    
//       console.log(students);
      
//     // 4. Fetch attendance records for the given week
//     const attendanceRecords = await Attendance.find({
//       student: { $in: paginatedStudentIds },
//       group: groupId,
//       subject: subject._id,
//       weekNumber: parseInt(week),
//     })
//       .select("student status checkInTime checkOutTime")
//       .lean();
    
//     console.log(attendanceRecords);
    
//     const attendanceMap = new Map();
//     attendanceRecords.forEach((record) => {
//       attendanceMap.set(record.student.toString(), record);
//     });
  
//     // 5. Prepare response
//     const result = students.map((student) => {
//       const fullName = `${student.user_id.firstName} ${student.user_id.lastName}`;
//       const record = attendanceMap.get(student._id.toString());
      
//       console.log(record);
      
//       return {
//         _id: student._id,
//         student_id: student.student_id,
//         fullName,
//         status: record?.status || "absent",
//         checkInTime: record?.checkInTime || null,
//         checkOutTime: record?.checkOutTime || null,
//       };
//     });
  
//     return res.status(200).json({
//       group: {
//         _id: group._id,
//         name: group.name,
//         subject: {
//           _id: subject._id,
//           name: subject.name,
//         },
//       },
//       week: parseInt(week),
//       students: result,
//       pagination: {
//         total: totalStudents,
//         page: numericPage,
//         limit: numericLimit,
//         totalPages,
//       },
//     });
//   };
export const getGroupWeeklyAttendance = async (req, res) => {
  const { groupId } = req.params;
  const { week, page = 1, limit = 10 } = req.query;

  const numericPage = parseInt(page);
  const numericLimit = parseInt(limit);

  console.log("📥 Request received for group:", groupId);
  console.log("📅 Week number:", week, " | Page:", page, " | Limit:", limit);

  // 1. Fetch group
  const group = await Group.findById(groupId)
    .populate("subject_id", "name")
    .lean();

  if (!group) {
    console.log("❌ Group not found");
    return res.status(404).json({ message: "Group not found" });
  }

  const subject = group.subject_id;
  const studentIds = group.students;

  console.log("✅ Group found:", group.name);
  console.log("📚 Subject:", subject.name);
  console.log("👥 Total students in group:", studentIds.length);

  // 2. Pagination calculation
  const totalStudents = studentIds.length;
  const totalPages = Math.ceil(totalStudents / numericLimit);
  const skip = (numericPage - 1) * numericLimit;
  const paginatedStudentIds = studentIds.slice(skip, skip + numericLimit);

  console.log("📄 Pagination: Skipping", skip, " | Fetching", paginatedStudentIds.length, "students");

  // 3. Fetch student details
  const students = await Student.find({ _id: { $in: paginatedStudentIds } })
    .populate("user_id", "firstName lastName")
    .lean();

  console.log("✅ Fetched student details:", students.length, "students");

  // 4. Fetch attendance records for the given week
  const numericWeek = parseInt(week);
  console.log("🔍 Fetching attendance records for week:", numericWeek);

  const attendanceRecords = await Attendance.find({
    student: { $in: paginatedStudentIds },
    group: groupId,
    subject: subject._id,
    weekNumber: numericWeek,
  })
    .select("student status checkInTime checkOutTime")
    .lean();

  console.log("📊 Attendance records found:", attendanceRecords.length);
  if (attendanceRecords.length === 0) {
    console.log("⚠️ No attendance records found for the selected week/group/students.");
  }

  // 5. Build map
  const attendanceMap = new Map();
  attendanceRecords.forEach((record) => {
    const key = String(record.student);
    attendanceMap.set(key, record);
    console.log("🗂️ Record mapped for student:", key);
  });

  // 6. Final response formatting
  const result = students.map((student) => {
    const fullName = `${student.user_id.firstName} ${student.user_id.lastName}`;
    const studentIdStr = String(student._id);
    const record = attendanceMap.get(studentIdStr);

    if (!record) {
      console.log(`🟥 No attendance found for student: ${fullName} (${studentIdStr})`);
    }

    return {
      _id: student._id,
      student_id: student.student_id,
      fullName,
      status: record?.status || "absent",
      checkInTime: record?.checkInTime || null,
      checkOutTime: record?.checkOutTime || null,
    };
  });

  console.log("✅ Response prepared. Returning", result.length, "students.");

  return res.status(200).json({
    group: {
      _id: group._id,
      name: group.name,
      subject: {
        _id: subject._id,
        name: subject.name,
      },
    },
    week: numericWeek,
    students: result,
    pagination: {
      total: totalStudents,
      page: numericPage,
      limit: numericLimit,
      totalPages,
    },
  });
};


// ================== Download Weekly Attendance as pdf ============================
export const downloadGroupAttendance = async (req, res) => {
  const { groupId } = req.params;
  const { week } = req.query;

  if (!week) return res.status(400).json({ message: "Week number is required" });

  const group = await Group.findById(groupId).populate("subject_id").lean();
  if (!group) return res.status(404).json({ message: "Group not found" });

  const students = await Student.find({ _id: { $in: group.students } })
    .populate("user_id", "firstName lastName")
    .lean();

  const attendanceRecords = await Attendance.find({
    group: groupId,
    weekNumber: Number(week),
  }).lean();

  const attendanceData = students.map((student) => {
    const record = attendanceRecords.find((a) => a.student.toString() === student._id.toString());
    return {
      fullName: `${student.user_id.firstName} ${student.user_id.lastName}`,
      student_id: student.student_id,
      status: record?.status || "Absent",
      checkInTime: record?.checkInTime || null,
      checkOutTime: record?.checkOutTime || null,
    };
  });

  const pdfDoc = generateAttendancePDF({
    groupName: group.name,
    subjectName: group.subject_id.name,
    week,
    attendanceData,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Attendance_Week${week}_${group.name}.pdf`
  );

  pdfDoc.pipe(res);
};

//======================== Update Attendance Status ========================
export const updateAttendanceStatus = async (req, res) => {
  const { attendanceId } = req.params;
  const { newStatus } = req.body;
  const staffUserId = req.authUser._id;

  // 1. Fetch attendance record
  const attendance = await Attendance.findById(attendanceId)
    .populate("group")
    .populate("student");

  if (!attendance) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  const { group, student, sessionType } = attendance;
  if (!group || !student) {
    return res.status(400).json({ message: "Attendance record is missing group or student information" });
  }

  // 2. Fetch staff profile
  const staff = await Staff.findOne({ user_id: staffUserId });
  if (!staff) {
    return res.status(404).json({ message: "Staff profile not found" });
  }

  // 3. Confirm the staff is assigned to this group
  const staffAssignment = group.staff.find((s) => s.staff_id.toString() === staff._id.toString());
  if (!staffAssignment) {
    return res.status(403).json({ message: "You are not assigned to this group" });
  }

  // 4. Check role-based permissions
  const staffRole = staffAssignment.role; // from group
  const isLecture = sessionType === "lecture";
  const isLab = sessionType === "lab";

  const roleAllowed =
    (isLecture && staffRole === "lecturer") ||
    (isLab && (staffRole === "lecturer" || staffRole === "assistant_lecturer"));

  if (!roleAllowed) {
    return res.status(403).json({
      message: "You are not authorized to update attendance for this session type",
    });
  }

// 5. Update status and approval
const wasPending = ["pending", "checked-in-pending"].includes(attendance.status); // original status

attendance.status = newStatus;

if (wasPending) {
  if (newStatus === "attended") {
    attendance.approved = "approved";
  } else if (newStatus === "absent") {
    attendance.approved = "rejected";
  } else {
    attendance.approved = "unreviewed";
  }
}

await attendance.save();

  // 6. Success response
  return res.status(200).json({
    message: "Attendance status updated successfully",
    data: {
      student: student._id,
      newStatus: attendance.status,
      approved: attendance.approved,
    },
  });
};

//====================== get Weekly Attendance For Group ===========================
export const getWeeklyAttendanceForGroup = async (req, res, next) => {
  const { groupId } = req.params;
  const staffUserId = req.authUser._id;

  // 1. Get staff document using user_id
  const staffProfile = await Staff.findOne({ user_id: staffUserId });
  if (!staffProfile) return next(new AppError("Staff profile not found", 404));

  // console.log(groupId);
  
  // 2. Fetch group and verify staff assignment
  const group = await Group.findById(groupId);
  // console.log(group);
  
  if (!group) return next(new AppError("Group not found", 404));

  const staffAssignment = group.staff.find(
    (s) => s.staff_id.toString() === staffProfile._id.toString()
  );

  if (!staffAssignment) {
    return next(new AppError("You are not assigned to this group", 403));
  }

  // 3. Determine allowed session types based on staff **position**
  const staffPosition = staffProfile.position;
  let allowedSessionTypes = [];

  if (staffPosition === "Lecturer") {
    allowedSessionTypes = ["lecture"];
  } else if (staffPosition === "Assistant-lecturer") {
    allowedSessionTypes = ["lab"];
  } else {
    return next(new AppError("Invalid staff position", 400));
  }

  console.log(allowedSessionTypes);
  
  // 4. Get attendance records for the group with allowed session types
  const records = await Attendance.find({
    group: groupId,
    // sessionType: { $in: allowedSessionTypes },
  })
    .populate({
      path: "student",
      populate: { path: "user_id", select: "-password -refresh_tokens -token_blacklist" },
    })
    .sort({ weekNumber: 1, sessionDate: 1 });

    
  // 5. Group by weekNumber and limit to first 3 per week
  const grouped = {};

  for (const record of records) {
    const week = record.weekNumber;
    if (!grouped[week]) grouped[week] = [];
    if (grouped[week].length < 3) grouped[week].push(record);
  }

  // 6. Format response
  const result = Object.entries(grouped)
    .map(([weekNumber, records]) => ({
      weekNumber: Number(weekNumber),
      records,
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return res.status(200).json({
    message: "Weekly attendance retrieved successfully",
    data: result,
  });
};


//====================== get Session Attendance Result ========================
export const getAttendanceResultsForSession = async (req, res, next) => {
  const { groupId } = req.params;
  const { sessionDate, sessionType } = req.query;

  if (!sessionDate || !sessionType) {
    return next(new AppError("sessionDate and sessionType are required", 400));
  }

  // Validate sessionType
  if (!["lecture", "lab"].includes(sessionType)) {
    return next(new AppError("Invalid sessionType value", 400));
  }

  // Parse sessionDate boundaries
  const parsedDate = new Date(sessionDate);
  if (isNaN(parsedDate)) {
    return next(new AppError("Invalid sessionDate format", 400));
  }

  const sessionStart = new Date(parsedDate.setHours(0, 0, 0, 0));
  const sessionEnd = new Date(parsedDate.setHours(23, 59, 59, 999));

  // Fetch all attendance records for that session
  const records = await Attendance.find({
    group: groupId,
    sessionType,
    sessionDate: { $gte: sessionStart, $lte: sessionEnd },
  }).populate({
    path: "student",
    populate: {
      path: "user_id",
      select: "-password -pfp -refresh_tokens -token_blacklist",
    },
  });

    
  // Separate into attended and pending
  const attended = [];
  const pending = [];

  for (const record of records) {
    if (record.status === "attended") {
      attended.push(record);
    } else if (
      record.status === "pending" &&
      record.checkOutTime 
    ) {
      pending.push(record);
    }
  }
  
  return res.status(200).json({
    message: "Final session snapshot retrieved successfully",
    data: {
      attended,
      pending,
    },
  });
};

//====== ========== Accept All Pending Students for a Session ================
export const acceptAllPendingStudents = async (req, res, next) => {
  const { groupId } = req.params;
  const { sessionDate, sessionType } = req.body;
  const staffUserId = req.authUser._id;

  // 1. Get staff profile
  const staffProfile = await Staff.findOne({ user_id: staffUserId });
  if (!staffProfile) return next(new AppError("Staff profile not found", 404));

  // 2. Fetch group and verify staff assignment
  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  const staffAssignment = group.staff.find(
    (s) => s.staff_id.toString() === staffProfile._id.toString()
  );
  if (!staffAssignment) {
    return next(new AppError("You are not assigned to this group", 403));
  }

  // 3. Find all pending attendance records for the given session
  const recordsToUpdate = await Attendance.find({
    group: groupId,
    sessionDate: new Date(sessionDate),
    sessionType,
    status: "pending",
    approved: "unreviewed",
  });

  if (recordsToUpdate.length === 0) {
    return res.status(200).json({
      message: "No pending records to approve",
      data: [],
    });
  }

  // 4. Update records
  const bulkOps = recordsToUpdate.map((record) => ({
    updateOne: {
      filter: { _id: record._id },
      update: { $set: { status: "attended", approved: "approved" } },
    },
  }));

  await Attendance.bulkWrite(bulkOps);

  // 5. Fetch updated records (with student info)
  const updatedRecords = await Attendance.find({
    _id: { $in: recordsToUpdate.map((r) => r._id) },
  }).populate({
    path: "student",
    populate: {
      path: "user_id",
      select: "firstName lastName email university_email student_id",
    },
  });

  return res.status(200).json({
    message: "All pending students have been approved",
    data: updatedRecords,
  });
};


//================ Reject All Pending Students for a Session ================
export const rejectAllPendingStudents = async (req, res) => {
  const { groupId } = req.params;
  const { sessionDate, sessionType } = req.body;

  const parsedSessionDate = new Date(sessionDate);

  const updatedAttendances = await Attendance.updateMany(
    {
      group: groupId,
      sessionDate: {
        $gte: new Date(parsedSessionDate.setHours(0, 0, 0, 0)),
        $lte: new Date(parsedSessionDate.setHours(23, 59, 59, 999)),
      },
      sessionType,
      status: "pending",
    },
    {
      $set: {
        status: "absent",
        approved: "rejected",
      },
    }
  );

  const updatedStudents = await Attendance.find({
    group: groupId,
    sessionDate: {
      $gte: new Date(parsedSessionDate.setHours(0, 0, 0, 0)),
      $lte: new Date(parsedSessionDate.setHours(23, 59, 59, 999)),
    },
    sessionType,
    status: "absent",
    approved: "rejected",
  })
    .populate({
      path: "student",
      populate: {
        path: "user_id",
        select: "firstName lastName email university_email",
      },
    })
    .select("student status approved");

  res.status(200).json({
    message: "All pending students have been rejected",
    updatedCount: updatedAttendances.modifiedCount,
    students: updatedStudents,
  });
};


//================ Get Student Attendance  ================
export const getStudentAttendanceHistory = async (req, res) => {
  const { studentId } = req.params;
  const { sort = "desc" } = req.query;
  const requesterId = req.authUser._id;
  const requesterRole = req.authUser.role;

  // 1. Allow only the logged-in student or an admin
  if (requesterRole === "student" && requesterId.toString() !== studentId) {
    return res.status(403).json({ message: "You are not authorized to access this student's history" });
  }

  // 2. Fetch attendance records excluding "absent"
  const attendanceRecords = await Attendance.find({
    student: studentId,
    status: { $ne: "absent" },
  })
    .sort({ sessionDate: sort === "asc" ? 1 : -1 })
    .populate("subject", "name code")
    .populate("group", "name")
    .select("status approved checkInTime checkOutTime sessionDate weekNumber sessionType subject group");

  return res.status(200).json({
    message: "Attendance history fetched successfully",
    total: attendanceRecords.length,
    data: attendanceRecords,
  });
};