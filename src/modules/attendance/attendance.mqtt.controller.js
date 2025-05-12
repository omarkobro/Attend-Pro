import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import Semester from "../../../DB/models/semster.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";
import { getWeekNumber } from "../../utils/calculateWeekNumber.js";


//================== Check-In Handler Functions =======================
export const handleCheckInRequest = async (payload) => {
  console.log("📥 [Check-In] Payload received:", payload);

  const { student_id, rfid_tag, device_id, marked_by } = payload;
  const responseTopic = `attendance/check-in/response/${device_id}`;
  const now = new Date();

  // 1. Fetch and validate device
  const device = await Device.findOne({ device_id }).lean();
  console.log("📟 [Check-In] Device fetched:", device);

  if (!device) {
    console.warn("❌ [Check-In] Device not found");
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Device not found"
    }));
  }

  if (device.status !== "reserved" || device.sessionMode !== "check-in") {
    console.warn("❌ [Check-In] Device is not ready:", {
      status: device.status,
      sessionMode: device.sessionMode
    });
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Device is not ready for check-in"
    }));
  }

  // 2. Fetch student with populated fields
  let student = null;
  if (student_id) {
    student = await Student.findOne({ student_id })
      .populate("user_id", "firstName lastName email")
      .populate({ path: "groups", select: "_id subject_id" })
      .lean();
  } else if (rfid_tag) {
    student = await Student.findOne({ rfid_tag })
      .populate("user_id", "firstName lastName email")
      .populate({ path: "groups", select: "_id subject_id" })
      .lean();
  }

  console.log("🎓 [Check-In] Student fetched:", student);

  if (!student) {
    console.warn("❌ [Check-In] Student not found for:", student_id || rfid_tag);
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: `Student not found for ${student_id || rfid_tag}`,
    }));
  }

  if (student_id && rfid_tag && student.rfid_tag !== rfid_tag) {
    console.warn("❌ [Check-In] RFID tag mismatch for student_id:", student_id);
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "RFID tag mismatch with student ID.",
    }));
  }

  const { currentSubjectId, currentGroupId} = device;

  // 3. Fetch group
  const group = await Group.findById(currentGroupId).lean();
  console.log("👥 [Check-In] Group fetched:", group);

  if (!group || group.subject_id.toString() !== currentSubjectId.toString()) {
    console.warn("❌ [Check-In] Group not found or mismatched with subject");
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Group mismatch or not found.",
    }));
  }

  // 4. Check if student is in the group
  const isInGroup = group.students.some(id => id.toString() === student._id.toString());
  console.log(`✅ [Check-In] isInGroup: ${isInGroup}`);

  // 5. Fast Response to PI
  const fastResponse = {
    success: true,
    message: isInGroup ? "Checked in" : "Pending check-in",
    student_id: student.student_id,
    status: isInGroup ? "checked-in" : "checked-in-pending",
    fullName: `${student.user_id.firstName} ${student.user_id.lastName}`
  };
  console.log("📤 [Check-In] Fast response to MQTT:", fastResponse);
  mqttClient.publish(responseTopic, JSON.stringify(fastResponse));

  // 6. Continue with background attendance processing
  try {
    await queueBackgroundCheckIn(student, device, isInGroup, marked_by, now);
  } catch (err) {
    console.error("🔥 [Check-In] Error in background processing:", err);
  }
};


//================== Background Processing Function =======================
const queueBackgroundCheckIn = async (student, device, isInGroup, marked_by, now) => {
  console.log("🔁 [Queue] Background check-in started...");

  const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  console.log("🕒 [Queue] Session window:", { sessionStart, sessionEnd });

  let groupIdToUse = device.currentGroupId;

  if (!isInGroup) {
    const correctGroup = student.groups.find(g =>
      g.subject_id?.toString() === device.currentSubjectId.toString()
    );
    if (correctGroup) {
      console.log("📚 [Queue] Found matching group for subject:", correctGroup._id);
      groupIdToUse = correctGroup._id;
    } else {
      console.warn("⚠️ [Queue] No matching group for student with subject:", device.currentSubjectId);
    }
  }

// 1. Get current semester
const semester = await Semester.findOne({ isCurrent: true }).lean();
if (!semester) {
  console.error("❌ No active semester found.");
  return;
}

// 2. Dynamically calculate week number
const weekNumber = getWeekNumber(sessionStart, semester);


  // 1. Check for existing attendance
  const existingAttendance = await Attendance.findOne({
    student: student._id,
    subject: device.currentSubjectId,
    group: groupIdToUse,
    sessionDate: { $gte: sessionStart, $lt: sessionEnd },
    weekNumber,
    sessionType: device.sessionType,
  });
  console.log("📄 [Queue] Existing attendance:", existingAttendance?._id || "None");

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
    console.log("✅ [Queue] Attendance updated:", updatedAttendance._id);
  } else {
    updatedAttendance = await Attendance.create({
      student: student._id,
      subject: device.currentSubjectId,
      group: groupIdToUse,
      sessionDate: sessionStart,
      weekNumber,
      sessionType: device.sessionType,
      device: device._id,
      checkInTime: now,
      status: isInGroup ? "checked-in" : "checked-in-pending",
      marked_by,
    });
    console.log("🆕 [Queue] New attendance created:", updatedAttendance._id);
  }

  // 2. Emit socket update
  const checkInInfo = {
    _id: updatedAttendance._id,
    student: {
      _id: student._id,
      fullName: `${student.user_id.firstName} ${student.user_id.lastName}`,
      student_id: student.student_id,
    },
    status: updatedAttendance.status,
    checkInTime: updatedAttendance.checkInTime,
    sessionDate : updatedAttendance.sessionDate //Check For This with chat gpt 
  };
  console.log("📡 [Queue] Emitting socket event:", checkInInfo);
  io.to(`session-${device.currentGroupId}`).emit("student-check-in", checkInInfo);

  // 3. Create notification
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
  console.log("📨 [Queue] Notification created for student:", student.student_id);
};
 

//================== Check-Out Handler Functions =======================
export const handleCheckOutRequest = async (payload) => {
  console.log("📥 [Check-Out] Payload received:", payload);

  const { rfid_tag, student_id, device_id, marked_by } = payload;
  const responseTopic = `attendance/check-out/response/${device_id}`;

  // 1. Validate device_id presence
  if (!device_id) {
    console.warn("❌ [Check-Out] Missing device_id");
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Missing device_id.",
    }));
  }

  // 2. Fetch and validate device
  const device = await Device.findOne({ device_id }).lean();
  console.log("📟 [Check-Out] Device fetched:", device);

  if (!device) {
    console.warn("❌ [Check-Out] Device not found");
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Device not found.",
    }));
  }

  if (device.status !== "reserved" || device.sessionMode !== "check-out") {
    console.warn("❌ [Check-Out] Device is not ready:", {
      status: device.status,
      sessionMode: device.sessionMode
    });
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Device is not ready for check-out.",
    }));
  }

  // 3. Validate presence of student_id or rfid_tag
  if (!student_id && !rfid_tag) {
    console.warn("❌ [Check-Out] Missing student_id or rfid_tag");
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "Missing student_id or rfid_tag.",
    }));
  }

  // 4. Fetch student
  let student = null;
  if (student_id) {
    student = await Student.findOne({ student_id })
      .populate("user_id", "firstName lastName email")
      .lean();
  } else if (rfid_tag) {
    student = await Student.findOne({ rfid_tag })
      .populate("user_id", "firstName lastName email")
      .lean();
  }

  console.log("🎓 [Check-Out] Student fetched:", student);

  if (!student) {
    console.warn("❌ [Check-Out] Student not found for:", student_id || rfid_tag);
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: `Student not found for ${student_id || rfid_tag}`,
    }));
  }

  if (student_id && rfid_tag && student.rfid_tag !== rfid_tag) {
    console.warn("❌ [Check-Out] RFID tag mismatch for student_id:", student_id);
    return mqttClient.publish(responseTopic, JSON.stringify({
      success: false,
      message: "RFID tag mismatch with student ID.",
    }));
  }

  // 5. Fast Response to PI
  const fastResponse = {
    success: true,
    message: "Check-out received.",
    student_id: student.student_id,
    status: "check-out-received",
    fullName: `${student.user_id.firstName} ${student.user_id.lastName}`
  };
  console.log("📤 [Check-Out] Fast response to MQTT:", fastResponse);
  mqttClient.publish(responseTopic, JSON.stringify(fastResponse));

  // 6. Background processing
  try {
    await handleCheckOutInBackground(payload);
  } catch (err) {
    console.error("🔥 [Check-Out] Error in background processing:", err);
  }
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

    const { currentSubjectId, currentGroupId, sessionType } = device;

    const semester = await Semester.findOne({ isCurrent: true }).lean();
    if (!semester) {
      console.error("❌ No active semester found.");
      return;
    }
    const now = new Date();
    const sessionStart = new Date(now.setHours(0, 0, 0, 0));
    const sessionEnd = new Date(now.setHours(23, 59, 59, 999));
    const weekNumber = getWeekNumber(sessionStart, semester);

    
    const attendance = await Attendance.findOne({
      student: student._id,
      subject: currentSubjectId,
      sessionDate: { $gte: sessionStart, $lte: sessionEnd },
      weekNumber,
      sessionType,
    });

    console.log(attendance);
    
    if (!attendance) {
      console.log("❌ No attendance record found for this student today");
      return;
    }

    let newStatus = attendance.status;
    console.log(newStatus);
    
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
      sessionDate : updatedAttendance.sessionDate
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
