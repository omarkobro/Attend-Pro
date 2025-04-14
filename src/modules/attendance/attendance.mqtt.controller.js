import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";


//================== Check-In Handler Functions =======================
export const handleCheckInRequest = async (payload) => {
  const { student_id, rfid_tag, device_id, marked_by } = payload;

  const responseTopic = `attendance/check-in/response/${device_id}`;
  const now = new Date();
  
  // Fetch and validate device
  const device = await Device.findOne({ device_id }).lean();
  if (!device || device.status !== "reserved" || device.sessionMode !== "check-in") {
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Device is not ready for check-in"
    }));
  }

  // Fetch student
  let student = null;
  if (student_id) {
    student = await Student.findOne({ student_id }).populate("user_id", "firstName lastName email").lean();
  } else if (rfid_tag) {
    student = await Student.findOne({ rfid_tag }).populate("user_id", "firstName lastName email").lean();
  }

  if (!student) {
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: `Student not found for ${student_id || rfid_tag}`,
    }));
  }

  if (student_id && rfid_tag && student.rfid_tag !== rfid_tag) {
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "RFID tag mismatch with student ID.",
    }));
  }

  const { currentSubjectId, currentGroupId, weekNumber, sessionType } = device;

  // Fetch group
  const group = await Group.findById(currentGroupId).lean();
  if (!group || group.subject_id.toString() !== currentSubjectId.toString()) {
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Group mismatch or not found.",
    }));
  }

  // Is student in group?
  const isInGroup = group.students.some(id => id.toString() === student._id.toString());

  // ⏱️ Fast Response to PI
  mqttClient.publish(responseTopic, JSON.stringify({
    success: true,
    message: isInGroup ? "Checked in" : "Pending check-in",
    student_id: student.student_id,
    status: isInGroup ? "checked-in" : "checked-in-pending",
    fullName: `${student.user_id.firstName} ${student.user_id.lastName}`
  }));

  // 🔁 Continue to Part 2 in background
  queueBackgroundCheckIn(student, device, isInGroup, marked_by, now);
};

const queueBackgroundCheckIn = async (student, device, isInGroup, marked_by, now) => {
  const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const existingAttendance = await Attendance.findOne({
    student: student._id,
    subject: device.currentSubjectId,
    group: device.currentGroupId,
    sessionDate: { $gte: sessionStart, $lt: sessionEnd },
    weekNumber: device.weekNumber,
    sessionType: device.sessionType,
  });

  let updatedAttendance;
  if (existingAttendance) {
    updatedAttendance = await Attendance.findByIdAndUpdate(
      existingAttendance._id,
      {
        status: isInGroup ? "checked-in" : "checked-in-pending",
        checkInTime: now,
        marked_by,
      },
      { new: true }
    );
  } else {
    updatedAttendance = await Attendance.create({
      student: student._id,
      subject: device.currentSubjectId,
      group: device.currentGroupId,
      sessionDate: sessionStart,
      weekNumber: device.weekNumber,
      sessionType: device.sessionType,
      device: device._id,
      checkInTime: now,
      status: isInGroup ? "checked-in" : "checked-in-pending",
      marked_by,
    });
  }

  // Send real-time update to UI
  const checkInInfo = {
    _id: updatedAttendance._id,
    student: {
      _id: student._id,
      fullName: `${student.user_id.firstName} ${student.user_id.lastName}`,
      student_id: student.student_id,
    },
    status: updatedAttendance.status,
    checkInTime: updatedAttendance.checkInTime,
  };
  io.to(`session-${device.currentGroupId}`).emit("student-check-in", checkInInfo);

  // Save notification
  const message = isInGroup
    ? "You have successfully checked in."
    : "You have been marked as pending.";

  await Notification.create({
    recipient: student.user_id,
    title: `${device.sessionType} Check-in`,
    message,
    type: "attendance",
    related_data: { attendance_id: updatedAttendance._id }
  });
};
 

//================== Check-Out Handler Functions =======================
export const handleCheckOutRequest = (payload) => {
  const { rfid_tag, student_id, device_id } = payload;

  console.log("hello2");
  
  // Basic validation
  if (!rfid_tag && !student_id) {
    return mqttClient.publish(
      "attendance/check-out/response",
      JSON.stringify({
        success: false,
        message: "Missing student_id or rfid_tag.",
      })
    );
  }

  if (!device_id) {
    return mqttClient.publish(
      "attendance/check-out/response",
      JSON.stringify({
        success: false,
        message: "Missing device_id.",
      })
    );
  }

  
  // Immediate response to Raspberry Pi
  mqttClient.publish(
    "attendance/check-out/response",
    JSON.stringify({
      success: true,
      message: "Checkout request received.",
    }),
    { qos: 1 }
    
  );

  console.log("f1 success");
  
  // Background processing
  handleCheckOutInBackground(payload);
};

const handleCheckOutInBackground = async (payload) => {
  const { rfid_tag, student_id, device_id, marked_by } = payload;
  console.log("📥 [Check-Out] Received payload:", payload);

  try {
    const device = await Device.findOne({ device_id }).lean();
    if (!device) {
      console.log("❌ Device not found:", device_id);
      return;
    }
    if (device.status !== "reserved") {
      console.log(`❌ Device is not reserved (status = ${device.status})`);
      return;
    }
    if (device.sessionMode !== "check-out") {
      console.log(`❌ Device is not in check-out mode (mode = ${device.sessionMode})`);
      return;
    }

    let student;
    if (student_id) {
      student = await Student.findOne({ student_id })
        .populate("user_id", "firstName lastName email")
        .lean();
    } else if (rfid_tag) {
      student = await Student.findOne({ rfid_tag })
        .populate("user_id", "firstName lastName email")
        .lean();
    }

    if (!student) {
      console.log("❌ Student not found by student_id or rfid_tag");
      return;
    }

    if (student_id && rfid_tag && student.rfid_tag !== rfid_tag) {
      console.log("❌ Mismatch: student_id and rfid_tag do not match the same student");
      return;
    }

    const { currentSubjectId, currentGroupId, weekNumber, sessionType } = device;
    const now = new Date();
    const sessionStart = new Date(now.setHours(0, 0, 0, 0));
    const sessionEnd = new Date(now.setHours(23, 59, 59, 999));

    const attendance = await Attendance.findOne({
      student: student._id,
      subject: currentSubjectId,
      group: currentGroupId,
      sessionDate: { $gte: sessionStart, $lte: sessionEnd },
      weekNumber,
      sessionType,
    });

    if (!attendance) {
      console.log("❌ No attendance record found for this student today");
      return;
    }

    let newStatus = attendance.status;
    if (attendance.status === "checked-in") {
      newStatus = "attended";
    } else if (attendance.status === "checked-in-pending") {
      newStatus = "pending";
    } else {
      console.log("❌ Student has invalid status for check-out:", attendance.status);
      return;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        checkOutTime: now,
        status: newStatus,
        marked_by,
      },
      { new: true }
    );

    console.log("✅ Attendance updated:", {
      attendanceId: updatedAttendance._id,
      newStatus,
    });

    const checkOutInfo = {
      _id: updatedAttendance._id,
      student: {
        _id: student._id,
        fullName: `${student.user_id.firstName} ${student.user_id.lastName}`,
        student_id: student.student_id,
      },
      status: updatedAttendance.status,
      checkOutTime: updatedAttendance.checkOutTime,
    };

    io.to(`session-${currentGroupId}`).emit("student-check-out", checkOutInfo);
    console.log("📤 Emitted student-check-out socket event");

    const message =
      updatedAttendance.status === "attended"
        ? `You have successfully checked out from the ${sessionType} session.`
        : `You have checked out, but your attendance is pending review.`;

    const notification = new Notification({
      recipient: student.user_id,
      title: `${sessionType === "lecture" ? "Lecture" : "Lab"} Check-out Status`,
      message,
      type: "attendance",
      related_data: { attendance_id: updatedAttendance._id },
    });

    await notification.save();
    console.log("🔔 Notification saved for student:", student.user_id);

  } catch (error) {
    console.error("❗ Error in handleCheckOutInBackground:", error.message, error);
  }
};
