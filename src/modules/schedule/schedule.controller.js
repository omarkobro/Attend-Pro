import GeneralSchedule from "../../../DB/models/generalSchedule.model.js";
import UserSchedule from "../../../DB/models/userSchedule.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Student from "../../../DB/models/student.model.js";
import Staff from "../../../DB/models/staff.model.js";
import moment from "moment";

//===================== create General Schedule API===============================
export const createGeneralSchedule = async (req, res) => {
  const { year, group_name, schedule } = req.body;

  const groups = await Group.find({ name: group_name });
  if (groups.length === 0) {
    return res.status(404).json({ message: `No group found with name "${group_name}"` });
  }

  const groupIds = groups.map(group => group._id);

  const subjects = await Subject.find({ groups: { $in: groupIds } }).select("_id name");
  if (subjects.length === 0) {
    return res.status(400).json({ message: `No subjects are assigned to group "${group_name}"` });
  }

  const subjectMap = {}; // { subject_id: subject_name }
  subjects.forEach(sub => subjectMap[sub._id.toString()] = sub.name);

  const subjectIds = Object.keys(subjectMap);

  
  for (const entry of schedule) {
    if (!subjectIds.includes(entry.subject_id)) {
      const subjectName = subjectMap[entry.subject_id] || `ID "${entry.subject_id}"`;
      return res.status(400).json({
        message: `Subject ${subjectName} is not linked to group "${group_name}". Please check subject-group associations.`,
      });
    }
  }

  const dailySlots = {}; // { day: [{ startTime, endTime, subject_id, sessionType }] }

  for (const entry of schedule) {
    const { day, startTime, endTime, subject_id, sessionType } = entry;

    if (!dailySlots[day]) dailySlots[day] = [];

    for (const existing of dailySlots[day]) {
      const currentSubjectName = subjectMap[subject_id];
      const existingSubjectName = subjectMap[existing.subject_id];

      // Check for same subject + sessionType on same day
      if (existing.subject_id === subject_id && existing.sessionType === sessionType) {
        return res.status(400).json({
          message: `Conflict on ${day}: The subject "${currentSubjectName}" already has a "${sessionType}" session scheduled.`,
        });
      }

      // Check for time overlap
      const overlap = !(
        endTime <= existing.startTime || // ends before existing starts
        startTime >= existing.endTime   // starts after existing ends
      );

      if (overlap) {
        return res.status(400).json({
          message: `Time conflict on ${day}: "${currentSubjectName}" (${sessionType}) from ${startTime} to ${endTime} overlaps with "${existingSubjectName}" (${existing.sessionType}) from ${existing.startTime} to ${existing.endTime}.`,
        });
      }
    }

    dailySlots[day].push({ startTime, endTime, subject_id, sessionType });
  }

  const newSchedule = await GeneralSchedule.create({ year, group_name, schedule });

  return res.status(201).json({
    message: "General schedule created successfully",
    data: newSchedule,
  });
};


//===================== Update General Schedule API===============================
export const updateGeneralSchedule = async (req, res) => {
  const { schedule_id, year, schedule } = req.body;

  const existingSchedule = await GeneralSchedule.findById(schedule_id);
  if (!existingSchedule) {
    return res.status(404).json({ message: "No general schedule found with the given ID." });
  }

  const updateData = { year };

  if (schedule) {
    const group_name = existingSchedule.group_name;

    const groups = await Group.find({ name: group_name });
    if (groups.length === 0) {
      return res.status(400).json({ message: `No groups found with name "${group_name}".` });
    }

    const groupIds = groups.map(group => group._id);

    const subjects = await Subject.find({ groups: { $in: groupIds } }).select("_id name");
    if (subjects.length === 0) {
      return res.status(400).json({ message: `No subjects associated with group "${group_name}".` });
    }

    const subjectMap = {};
    subjects.forEach(sub => subjectMap[sub._id.toString()] = sub.name);
    const subjectIds = Object.keys(subjectMap);

    for (const entry of schedule) {
      if (!subjectIds.includes(entry.subject_id)) {
        return res.status(400).json({
          message: `Subject with ID "${entry.subject_id}" is not linked to group "${group_name}". Please check subject-group associations.`,
        });
      }
    }

    // Conflict Validation
    const dailySlots = {}; // { day: [{ startTime, endTime, subject_id, sessionType }] }

    for (const entry of schedule) {
      const { day, startTime, endTime, subject_id, sessionType } = entry;

      if (!dailySlots[day]) dailySlots[day] = [];

      for (const existing of dailySlots[day]) {
        const currentSubjectName = subjectMap[subject_id];
        const existingSubjectName = subjectMap[existing.subject_id];

        if (existing.subject_id === subject_id && existing.sessionType === sessionType) {
          return res.status(400).json({
            message: `Conflict on ${day}: The subject "${currentSubjectName}" already has a "${sessionType}" session scheduled.`,
          });
        }

        const overlap = !(
          endTime <= existing.startTime || 
          startTime >= existing.endTime
        );

        if (overlap) {
          return res.status(400).json({
            message: `Time conflict on ${day}: "${currentSubjectName}" (${sessionType}) from ${startTime} to ${endTime} overlaps with "${existingSubjectName}" (${existing.sessionType}) from ${existing.startTime} to ${existing.endTime}.`,
          });
        }
      }

      dailySlots[day].push({ startTime, endTime, subject_id, sessionType });
    }

    updateData.schedule = schedule;
  }

  const updatedSchedule = await GeneralSchedule.findByIdAndUpdate(schedule_id, updateData, { new: true });

  return res.status(200).json({
    message: "General schedule updated successfully",
    data: updatedSchedule,
  });
};


//===================== get all General Schedules API===============================
export const getAllGeneralSchedules = async (req, res) => {
    const { year, group_name } = req.query;
    let filter = {};
  
    // Apply year filter if provided
    if (year) {
      filter.year = parseInt(year);
    }
  
  
    // Apply group filter if provided
    if (group_name) {
      filter.group_name = group_name; // Directly filter by group_name (no need for ObjectId lookup)
    }
  
  
    // Fetch schedules
    const schedules = await GeneralSchedule.find(filter)
      .populate({
        path: "schedule.subject_id",
        select: "name",
      });
  
  
    return res.status(200).json({
      message: "General schedules retrieved successfully",
      schedules,
    });
  };

  
//===================== getSchedulesGroupedByTimeAndDay API===============================
export const getSchedulesGroupedByTimeAndDay = async (req, res) => {
  const schedules = await GeneralSchedule.find({})
    .populate({
      path: "schedule.subject_id",
      select: "name"
    });

  const result = {};

  for (const entry of schedules) {
    const { group_name, schedule } = entry;

    for (const session of schedule) {
      const { day, startTime, endTime, sessionType, location, subject_id } = session;

      const timeRange = `${startTime} - ${endTime}`;
      if (!result[day]) result[day] = {};
      if (!result[day][timeRange]) result[day][timeRange] = [];

      result[day][timeRange].push({
        subject_id: subject_id?._id,
        subject_name: subject_id?.name,
        group_name,
        sessionType,
        location
      });
    }
  }

  return res.status(200).json({
    message: "Schedules grouped by time and day",
    data: result
  });
};


//===================== delete general Schedule API===============================
  export const deleteGeneralSchedule = async (req, res) => {
    const { schedule_id } = req.params;
  
    const deletedSchedule = await GeneralSchedule.findById({ _id: schedule_id });
  
    if (deletedSchedule.deletedCount === 0) {
      return res.status(404).json({ message: "General Schedule not found" });
    }
  
    return res.status(200).json({ message: "General Schedule deleted successfully" });
  };


//================= Create User Schedule API =========================
export const createUserSchedule = async (req, res) => {
  const { schedule } = req.body;
  const user_id = req.authUser._id;
  const role = req.authUser.role;

  let allowedSubjectIds = new Set();
  const subjectMap = {};

  if (role === "student") {
    const student = await Student.findOne({ user_id }).populate({
      path: "groups",
      populate: { path: "subject_id", select: "_id name" }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.groups.forEach(group => {
      const subject = group.subject_id;
      if (subject && subject._id) {
        allowedSubjectIds.add(subject._id.toString());
        subjectMap[subject._id.toString()] = subject.name;
      }
    });
  } else if (role === "staff" || role === "admin") {
    const staff = await Staff.findOne({ user_id }).populate("subjects", "_id name");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.subjects.forEach(subject => {
      allowedSubjectIds.add(subject._id.toString());
      subjectMap[subject._id.toString()] = subject.name;
    });
  } else {
    return res.status(403).json({ message: "Role Conflict, Try Again Later" });
  }

  let userSchedule = await UserSchedule.findOne({ user_id });
  const existingEntries = userSchedule ? userSchedule.schedule : [];

  const addedSubjects = [];
  const rejectedSubjects = [];

  const dailySlots = {}; // day -> [{ startTime, endTime, subject_id, sessionType }]

  for (const entry of existingEntries) {
    if (!dailySlots[entry.day]) dailySlots[entry.day] = [];
    dailySlots[entry.day].push({
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject_id: entry.subject_id,
      sessionType: entry.sessionType
    });
  }
  
  const seenNewSlots = {};

  for (const entry of schedule) {
    const { subject_id, day, startTime, endTime, location, sessionType } = entry;
    const slotKey = `${subject_id}-${day}-${startTime}-${endTime}-${sessionType}`;

    const subjectName = subjectMap[subject_id] || "Unknown Subject";

    // 1. Not allowed for user
    if (!allowedSubjectIds.has(subject_id)) {
      rejectedSubjects.push({
        subject_id,
        subject_name: subjectName,
        day,
        startTime,
        sessionType,
        reason: "Subject is not assigned to you"
      });
      continue;
    }

    // 2. Duplicate in submitted schedule
    if (seenNewSlots[slotKey]) {
      rejectedSubjects.push({
        subject_id,
        subject_name: subjectName,
        day,
        startTime,
        sessionType,
        reason: "Duplicate entry in submitted schedule"
      });
      continue;
    }
    seenNewSlots[slotKey] = true;

    // 3. Conflict with existing schedule
    if (!dailySlots[day]) dailySlots[day] = [];

    const overlap = dailySlots[day].some(slot => {
      const conflict = !(endTime <= slot.startTime || startTime >= slot.endTime);
      const sameSubjectAndSession = (
        slot.subject_id.toString() === subject_id &&
        slot.sessionType === sessionType
      );
      return conflict || sameSubjectAndSession;
    });

    if (overlap) {
      rejectedSubjects.push({
        subject_id,
        subject_name: subjectName,
        day,
        startTime,
        sessionType,
        reason: "Time conflict or duplicate sessionType for the same subject on this day"
      });
      continue;
    }

    // 4. Validate entry exists in GeneralSchedule
    const existsInGeneral = await GeneralSchedule.exists({
      'schedule.subject_id': subject_id,
      'schedule.day': day,
      'schedule.startTime': startTime,
      'schedule.endTime': endTime,
      'schedule.sessionType': sessionType
    });

    console.log(existsInGeneral);
    
    
    if (!existsInGeneral) {
      rejectedSubjects.push({
        subject_id,
        subject_name: subjectName,
        day,
        startTime,
        sessionType,
        reason: "Subject entry must be part of an existing general schedule, please check timings and session type and try again."
      });
      continue;
    }

    // Passed all checks
    addedSubjects.push(entry);
    dailySlots[day].push({ startTime, endTime, subject_id, sessionType });
  }

  if (addedSubjects.length === 0) {
    return res.status(400).json({
      message: "All provided entries are either invalid, duplicated, or conflict with existing schedule.",
      rejectedSubjects
    });
  }

  if (userSchedule) {
    userSchedule.schedule.push(...addedSubjects);
  } else {
    userSchedule = new UserSchedule({
      user_id,
      schedule: addedSubjects
    });
  }

  await userSchedule.save();

  res.status(201).json({
    message: "User schedule created successfully",
    addedSubjects,
    rejectedSubjects
  });
};



//================= Update User Schedule API=========================
export const updateUserSchedule = async (req, res) => {
  const { schedule } = req.body;
  const user_id = req.authUser._id;

  // Get all valid subjects from General Schedules
  const generalSchedules = await GeneralSchedule.find({}, "schedule.subject_id");
  const validSubjects = new Set(generalSchedules.flatMap(gs => gs.schedule.map(s => s.subject_id.toString())));

  // Fetch the user's existing schedule
  let userSchedule = await UserSchedule.findOne({ user_id });

  if (!userSchedule) {
    return res.status(404).json({ message: "User schedule not found." });
  }

  // Map existing schedule by day & time slots
  const scheduleMap = new Map();

  for (const entry of userSchedule.schedule) {
    const key = `${entry.day}-${entry.startTime}-${entry.endTime}`;
    scheduleMap.set(key, entry);
  }

  // Initialize arrays for valid updates and rejected subjects
  const updatedSchedule = [];
  const rejectedSubjects = [];

  for (const entry of schedule) {
    const { subject_id, day, startTime, endTime } = entry;
    const key = `${day}-${startTime}-${endTime}`;

    // Check if the subject exists in General Schedules
    if (!validSubjects.has(subject_id)) {
      rejectedSubjects.push({ subject_id, reason: "Subject is not part of any general schedule" });
      continue;
    }

    // If the time slot is occupied, check if we need to replace it
    if (scheduleMap.has(key)) {
      const existingEntry = scheduleMap.get(key);

      if (existingEntry.subject_id.toString() !== subject_id) {
        // Replace the existing subject with the new one
        scheduleMap.set(key, entry);
      } else {
        // Subject is already in that slot, no change needed
        continue;
      }
    } else {
      // No conflict, add to the schedule
      scheduleMap.set(key, entry);
    }
  }

  // Convert updated schedule map back to array
  userSchedule.schedule = Array.from(scheduleMap.values());

  // Save the updated schedule
  await userSchedule.save();

  res.status(200).json({
    message: "User schedule updated successfully",
    rejectedSubjects,
    schedule: userSchedule.schedule
  });
};

//================= Get User Schedule API=========================
export const getUserSchedule = async (req, res) => {
  const user_id = req.authUser._id;

  // Fetch the user's schedule and populate subject names
  const userSchedule = await UserSchedule.findOne({ user_id })
    .populate("schedule.subject_id", "name")
    .sort({ "schedule.day": 1, "schedule.startTime": 1 });

  // If schedule does not exist, return 404
  if (!userSchedule) {
    return res.status(404).json({ message: "User schedule not found." });
  }

  res.status(200).json({
    message: "User schedule retrieved successfully",
    schedule: userSchedule.schedule,
  });
};

//================= Get Upcoming Lectures API=========================
export const getUpcomingLectures = async (req, res) => {
  const user_id = req.authUser._id;
  const currentTime = moment().format("HH:mm"); // Get current time in HH:mm format
  const today = moment().format("dddd"); // Get today's day (e.g., "Monday")

  // Fetch the user's schedule
  const userSchedule = await UserSchedule.findOne({ user_id }).populate("schedule.subject_id", "name code");

  
  if (!userSchedule || userSchedule.schedule.length === 0) {    
    return res.status(404).json({ message: "No schedule found for the user." });
  }

  // Filter lectures for today that haven't started yet
  const upcomingLectures = userSchedule.schedule.filter(lecture => 
    lecture.day === today && lecture.startTime > currentTime
  );

  if (upcomingLectures.length === 0) {
    return res.status(200).json({ message: "No upcoming lectures for today." });
  }

  res.status(200).json({
    message: "Upcoming lectures retrieved successfully.",
    upcomingLectures
  });
};

//================= Delete User's Schedule API=========================
export const deleteUserSchedule = async (req, res) => {
  const user_id = req.authUser._id;

  // Check if user schedule exists
  const userSchedule = await UserSchedule.findOne({ user_id });
  if (!userSchedule) {
    return res.status(404).json({ message: "User schedule not found." });
  }

  // Delete the schedule
  await UserSchedule.deleteOne({ user_id });

  res.status(200).json({ message: "User schedule deleted successfully." });
};