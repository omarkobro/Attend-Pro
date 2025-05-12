import Device from "../../../DB/models/device.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Group from "../../../DB/models/group.model.js";
import mqttClient from "../../utils/mqtt.connection.js";

//===================== Create Device API ===========================
export const createDevice = async (req, res) => {
  const { device_id, location } = req.body;

  const existingDevice = await Device.findOne({ device_id });
  if (existingDevice) {
    return res
      .status(409)
      .json({ message: "Device with this ID already exists." });
  }

  const newDevice = await Device.create({ device_id, location });
  res
    .status(201)
    .json({ message: "Device created successfully", device: newDevice });
};

//===================== Update Device API ===========================
export const updateDevice = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const updatedDevice = await Device.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updatedDevice) {
    return res.status(404).json({ message: "Device not found" });
  }

  res.status(200).json({
    message: "Device updated successfully",
    device: updatedDevice,
  });
};

//===================== Update Device API ===========================
export const deleteDevice = async (req, res) => {
  const { id } = req.params;

  const deletedDevice = await Device.findByIdAndDelete(id);

  if (!deletedDevice) {
    return res.status(404).json({ message: "Device not found" });
  }

  res.status(200).json({
    message: "Device deleted successfully",
    device: deletedDevice,
  });
};

//===================== Get All Devices API ===========================
export const getAllDevices = async (req, res) => {
  const { location, status } = req.query;

  const query = {};

  if (location) {
    query.location = { $regex: location, $options: "i" }; // partial + case-insensitive
  }

  if (status) {
    query.status = status;
  }

  const devices = await Device.find(query)
    .populate("currentSubjectId", "name code")
    .populate("currentGroupId", "name");

  res.status(200).json({
    count: devices.length,
    devices,
  });
};

//===================== Get All Devices API ===========================
export const getDeviceById = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId)
    .populate("currentSubjectId", "name code")
    .populate("currentGroupId", "name");

  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  res.status(200).json({ device });
};

//===================== Select Device API ===========================
export const selectDevice = async (req, res) => {
  const { deviceId } = req.params;
  const { subjectId, groupId, sessionType} = req.body;
  
  // if (!weekNumber || isNaN(weekNumber) || weekNumber <= 0) {
  //   return res.status(400).json({ message: "Valid Week Number is required" });
  // }
  
  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.status === "reserved") {
    return res.status(400).json({ message: "Device is already reserved" });
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return res.status(404).json({ message: "Subject not found" });
  }

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // Check group belongs to subject
  if (!group.subject_id.equals(subject._id)) {
    return res
      .status(400)
      .json({ message: "Group does not belong to the provided subject" });
  }

  // Ensure no other device is already using this group
  const existing = await Device.findOne({
    currentGroupId: groupId,
    status: "reserved",
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "This group is already assigned to another device" });
  }

  device.status = "reserved";
  device.currentSubjectId = subject._id;
  device.currentGroupId = group._id;
  // device.weekNumber = weekNumber;
  device.sessionType = sessionType;
  device.sessionMode = null;

  await device.save();

  const populated = await device.populate("currentSubjectId currentGroupId");

  res.status(200).json({ message: "Device selected successfully", device: populated });
};

//===================== Cancel Device Selection API ===========================
export const cancelHallSelection = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.status === "free") {
    return res.status(400).json({ message: "Device is already free" });
  }

  await Device.findByIdAndUpdate(deviceId, {
    status: "free",
    currentSubjectId: null,
    currentGroupId: null,
    sessionMode: null,
    // weekNumber: null,
    sessionType: null
  }, { runValidators: false });
  
  res.status(200).json({ message: "Device reservation canceled successfully", device });
};


//===================== Start Check-in Session API ===========================
export const startCheckInSession = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.status !== "reserved") {
    return res.status(400).json({ message: "Device must be reserved before starting a check-in session" });
  }

  if (device.sessionMode === "check-in") {
    return res.status(400).json({ message: "Check-in session is already active on this device" });
  }

  device.sessionMode = "check-in";
  await device.save();

  // Publish to MQTT
  const topic = `devices/${device.device_id}/control`;
  const payload = JSON.stringify({ action: "start-check-in" });
  mqttClient.publish(topic, payload,(err) => {
    if (err) {
      console.error("MQTT publish error:", err);
    } else {
      console.log("MQTT message published to", topic);
    }
  });

  res.status(200).json({
    message: "Check-in session started successfully",
    device,
  });
};

//===================== End Check-in Session API ===========================
export const endCheckInSession = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.sessionMode !== "check-in") {
    return res.status(400).json({ message: "No active check-in session on this device" });
  }

  device.sessionMode = null;
  await device.save();

  // Publish to MQTT
  const topic = `devices/${device.device_id}/control`;
  const payload = JSON.stringify({ action: "end-check-in" });
  mqttClient.publish(topic, payload,(err) => {
    if (err) {
      console.error("MQTT publish error:", err);
    } else {
      console.log("MQTT message published to", topic);
    }
  });

  res.status(200).json({
    message: "Check-in session ended successfully",
    device,
  });
};

//===================== Start Check-out Session API ===========================
export const startCheckOutSession = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.status !== "reserved") {
    return res.status(400).json({ message: "Device must be reserved before starting a session" });
  }

  if (device.sessionMode !== null) {
    return res.status(400).json({ message: `Device is already in a "${device.sessionMode}" session` });
  }

  device.sessionMode = "check-out";
  await device.save();

  // Send MQTT message
  const topic = `devices/${device.device_id}/control`;
  const payload = JSON.stringify({ action: "start-check-out" });

  mqttClient.publish(topic, payload,(err) => {
    if (err) {
      console.error("MQTT publish error:", err);
    } else {
      console.log("MQTT message published to", topic);
    }
  });

  res.status(200).json({ message: "Check-out session started successfully", device });
};

//========================= End Check-out Session API ===========================
export const endCheckOutSession = async (req, res) => {
  const { deviceId } = req.params;

  const device = await Device.findById(deviceId);

  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (device.status !== "reserved" || device.sessionMode !== "check-out") {
    return res.status(400).json({ message: "No active check-out session found on this device" });
  }

  // Clear session data and free the hall
  device.sessionMode = null;
  device.status = "free";
  device.currentGroupId = null;
  device.currentSubjectId = null;

  await device.save();

  const topic = `devices/${device.device_id}/control`;
  const payload = JSON.stringify({action: "end-check-out",});

  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error("MQTT publish error:", err);
    } else {
      console.log("MQTT message published to", topic);
    }
  });

  res.status(200).json({
    message: "Check-out session ended successfully. Hall is now free.",
    device,
  });
};