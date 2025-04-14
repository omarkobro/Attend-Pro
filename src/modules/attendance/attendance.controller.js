import Attendance from "../../../DB/models/attendance.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Device from "../../../DB/models/device.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { io } from "../../utils/socket.js";
import mqttClient from "../../utils/mqtt.connection.js";

