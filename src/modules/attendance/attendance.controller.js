import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";
import { generateAttendancePDF } from "../../utils/pdfkit.js";

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