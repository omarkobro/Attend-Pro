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
  const { sessionDate, sessionType } = req.body;

  if (!sessionDate || !sessionType) {
    return next(new AppError("sessionDate and sessionType are required", 400));
  }

  if (!["lecture", "lab"].includes(sessionType)) {
    return next(new AppError("Invalid sessionType value", 400));
  }

  // Use native Date parser to validate sessionDate
  const parsed = new Date(sessionDate);
  if (isNaN(parsed.getTime())) {
    return next(new AppError("Invalid sessionDate format", 400));
  }

  // Normalize to start and end of that day in UTC
  const sessionStart = new Date(Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
    0, 0, 0, 0
  ));

  const sessionEnd = new Date(Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
    23, 59, 59, 999
  ));

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

  const attended = [];
  const pending = [];

  for (const record of records) {
    if (record.status === "attended") {
      attended.push(record);
    } else if (record.status === "pending" && record.checkOutTime) {
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
export const getStudentAttendanceHistory = async (req, res,next) => {
  const { studentId } = req.params;
  const { sort = "desc" } = req.query;
  const requesterRole = req.authUser.role;
  
  // 1. Allow only the logged-in student or an admin
  if (requesterRole === "student" && student._id.toString() !== studentId) {
    return res.status(403).json({ message: "You are not authorized to access this student's history" });
  }
  const student = await Student.findById(studentId);
  if (!student) return next(new AppError("student not found", 404));
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

//===================== Get Group Analytics ========================
export const getGroupAnalytics = async (req, res, next) => {
  const { groupId } = req.params;

  // 1. Fetch all attendance records for this group
  const attendances = await Attendance.find({ group: groupId }).select(
    "weekNumber status student"
  );

  if (!attendances.length) {
    return next(new AppError("No attendance records found for this group", 404));
  }

  // 2. Calculate Total Sessions
  const totalSessions = await Attendance.countDocuments({ group: groupId });

  if (!totalSessions) {
    return next(new AppError("No attendance sessions found for this group", 404));
  }

  // 3. Average Attendance Rate
  const attendedCount = attendances.filter((att) => att.status === "attended").length;
  const averageAttendanceRate = ((attendedCount / totalSessions) * 100).toFixed(1);

  // 4. Weekly Attendance Trend
  const weeklyCounts = {};
  attendances
    .filter((att) => att.status === "attended")
    .forEach((record) => {
      const week = record.weekNumber;
      weeklyCounts[week] = (weeklyCounts[week] || 0) + 1;
    });

  const weeklyAttendanceTrend = Object.entries(weeklyCounts)
    .map(([week, count]) => ({
      weekNumber: parseInt(week),
      attendedStudents: count,
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);

  // 5. Top Attending Students
  const studentAttendanceMap = {};

  attendances.forEach((att) => {
    const studentId = att.student.toString();
    if (!studentAttendanceMap[studentId]) {
      studentAttendanceMap[studentId] = { attended: 0, total: 0 };
    }
    studentAttendanceMap[studentId].total += 1;
    if (att.status === "attended") {
      studentAttendanceMap[studentId].attended += 1;
    }
  });

  const topAttendingStudents = await Promise.all(
    Object.entries(studentAttendanceMap)
      .map(async ([studentId, counts]) => {
        const attendanceRate = ((counts.attended / counts.total) * 100).toFixed(1);
        const student = await Student.findById(studentId).select("student_name student_id");
        return {
          studentId: studentId,
          studentName: student?.student_name || "Unknown",
          studentUniversityId: student?.student_id || "Unknown",
          attendanceRate: Number(attendanceRate),
        };
      })
  );

  // Sort top students by attendance rate descending and pick top 5
  const top5AttendingStudents = topAttendingStudents
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  // 6. Frequently Absent Students
  const absentCounts = {};

  attendances
    .filter((att) => att.status === "absent")
    .forEach((att) => {
      const studentId = att.student.toString();
      absentCounts[studentId] = (absentCounts[studentId] || 0) + 1;
    });

  const frequentlyAbsentStudents = await Promise.all(
    Object.entries(absentCounts)
      .map(async ([studentId, absentSessions]) => {
        const student = await Student.findById(studentId).select("student_name student_id");
        return {
          studentId: studentId,
          studentName: student?.student_name || "Unknown",
          studentUniversityId: student?.student_id || "Unknown",
          absentSessions,
        };
      })
  );

  // Sort by most absent and pick top 5
  const top5FrequentlyAbsentStudents = frequentlyAbsentStudents
    .sort((a, b) => b.absentSessions - a.absentSessions)
    .slice(0, 5);

  // 7. Pending Attendance Decisions
  const pendingAttendances = await Attendance.find({
    group: groupId,
    status: "pending",
  }).populate({
    path: "student",
    select: "student_name student_id",
  });

  const pendingAttendanceDecisions = pendingAttendances.map((record) => ({
    studentId: record.student?._id,
    studentName: record.student?.student_name || "Unknown",
    studentUniversityId: record.student?.student_id || "Unknown",
    sessionDate: record.sessionDate,
    status: record.status
  }));

  // 8. Final Success Response
  res.status(200).json({
    message: "Group analytics fetched successfully",
    data: {
      averageAttendanceRate: Number(averageAttendanceRate),
      weeklyAttendanceTrend,
      topAttendingStudents: top5AttendingStudents,
      frequentlyAbsentStudents: top5FrequentlyAbsentStudents,
      pendingAttendanceDecisions,
    },
  });
};


// ================== Get System Analytics ==================
export const getSystemAnalytics = async (req, res, next) => {
  const { academicYear } = req.query;

  // 1. Build subject filter if academicYear is provided
  const subjectFilter = {};
  if (academicYear) {
    subjectFilter.year = academicYear;
  }

  // 2. Fetch all subjects (filtered if academicYear provided)
  const subjects = await Subject.find(subjectFilter).select("_id name");  

  if (subjects.length === 0) {
    return next(new AppError("No subjects found for the selected academic year", 404));
  }

  const subjectIds = subjects.map((s) => s._id);

  // 3. Fetch all students (no academicYear filtering here anymore)
  const students = await Student.find().select("_id student_name student_id year");

  const studentIds = students.map((s) => s._id);

  if (students.length === 0) {
    return next(new AppError("No students found", 404));
  }

  // 4. Fetch all attendance records for these students and subjects
  const attendances = await Attendance.find({
    student: { $in: studentIds },
    // subject: { $in: subjectIds },
  });

  if (attendances.length === 0) {
    return next(new AppError("No attendance records found", 404));
  }

  // ================== 1. Absence Rate by Day of Week ==================
  const absenceByDay = {
    Sunday: { absent: 0, total: 0 },
    Monday: { absent: 0, total: 0 },
    Tuesday: { absent: 0, total: 0 },
    Wednesday: { absent: 0, total: 0 },
    Thursday: { absent: 0, total: 0 },
    Friday: { absent: 0, total: 0 },
    Saturday: { absent: 0, total: 0 },
  };

  attendances.forEach((record) => {
    const dayName = record.sessionDate.toLocaleString("en-US", { weekday: "long" });
    if (absenceByDay[dayName]) {
      absenceByDay[dayName].total++;
      if (record.status === "absent") absenceByDay[dayName].absent++;
    }
  });

  const absenceRateByDayOfWeek = Object.entries(absenceByDay).map(([day, counts]) => ({
    day,
    absenceRate: counts.total > 0 ? ((counts.absent / counts.total) * 100).toFixed(1) : 0,
  }));

  // ================== 2. Absence Rate by Subject ==================
  const absenceBySubject = {};
  subjects.forEach((subject) => {
    absenceBySubject[subject._id.toString()] = {
      subjectName: subject.name,
      absent: 0,
      total: 0,
    };
  });

  attendances.forEach((record) => {
    const subj = absenceBySubject[record.subject?.toString()];
    if (subj) {
      subj.total++;
      if (record.status === "absent") subj.absent++;
    }
  });

  const absenceRateBySubject = Object.values(absenceBySubject).map((subj) => ({
    subjectName: subj.subjectName,
    absenceRate: subj.total > 0 ? ((subj.absent / subj.total) * 100).toFixed(1) : 0,
  }));

  // ================== 3. Frequently Absent Students ==================
  const absenceCounts = {};

  attendances.forEach((record) => {
    if (record.status === "absent") {
      absenceCounts[record.student] = (absenceCounts[record.student] || 0) + 1;
    }
  });

  const frequentlyAbsentStudents = students
    .map((student) => ({
      studentName: student.student_name,
      studentId: student.student_id,
      absenceCount: absenceCounts[student._id] || 0,
      year: student.year,
    }))
    .filter((s) => s.absenceCount > 0)
    .sort((a, b) => b.absenceCount - a.absenceCount)
    .slice(0, 10);

  // ================== 4. Attendance by Session Type ==================
  const sessionTypeCounts = { lecture: { attended: 0, total: 0 }, lab: { attended: 0, total: 0 } };

  attendances.forEach((record) => {
    if (record.sessionType && sessionTypeCounts[record.sessionType]) {
      sessionTypeCounts[record.sessionType].total++;
      if (record.status === "attended") sessionTypeCounts[record.sessionType].attended++;
    }
  });

  const attendanceBySessionType = Object.entries(sessionTypeCounts).map(([type, counts]) => ({
    sessionType: type,
    attendanceRate: counts.total > 0 ? ((counts.attended / counts.total) * 100).toFixed(1) : 0,
  }));

  // ================== Final Success Response ==================
  res.status(200).json({
    message: "System analytics fetched successfully",
    data: {
      absenceRateByDayOfWeek,
      absenceRateBySubject,
      frequentlyAbsentStudents,
      attendanceBySessionType,
    },
  });
};
