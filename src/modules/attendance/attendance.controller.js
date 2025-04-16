import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";

//===================== Get Group Weekly Attendance =========================
export const getGroupWeeklyAttendance = async (req, res) => {
    const { groupId } = req.params;
    const { week, page = 1, limit = 10 } = req.query;
  
    const numericPage = parseInt(page);
    const numericLimit = parseInt(limit);
  
    // 1. Fetch the group and its subject
    const group = await Group.findById(groupId)
      .populate("subject_id", "name")
      .lean();
  
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
  
    const subject = group.subject_id;
    const studentIds = group.students;
  
    // 2. Pagination calculation
    const totalStudents = studentIds.length;
    const totalPages = Math.ceil(totalStudents / numericLimit);
    const skip = (numericPage - 1) * numericLimit;
  
    const paginatedStudentIds = studentIds.slice(skip, skip + numericLimit);
  
    // 3. Fetch student details
    const students = await Student.find({ _id: { $in: paginatedStudentIds } })
      .populate("user_id", "firstName lastName")
      .lean();
  
    // 4. Fetch attendance records for the given week
    const attendanceRecords = await Attendance.find({
      student: { $in: paginatedStudentIds },
      group: groupId,
      subject: subject._id,
      weekNumber: parseInt(week),
    })
      .select("student status checkInTime checkOutTime")
      .lean();
  
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.student.toString(), record);
    });
  
    // 5. Prepare response
    const result = students.map((student) => {
      const fullName = `${student.user_id.firstName} ${student.user_id.lastName}`;
      const record = attendanceMap.get(student._id.toString());
  
      return {
        _id: student._id,
        student_id: student.student_id,
        fullName,
        status: record?.status || "absent",
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
      };
    });
  
    return res.status(200).json({
      group: {
        _id: group._id,
        name: group.name,
        subject: {
          _id: subject._id,
          name: subject.name,
        },
      },
      week: parseInt(week),
      students: result,
      pagination: {
        total: totalStudents,
        page: numericPage,
        limit: numericLimit,
        totalPages,
      },
    });
  };