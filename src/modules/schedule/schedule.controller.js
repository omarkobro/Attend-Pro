import GeneralSchedule from "../../../DB/models/generalSchedule.model.js";
import UserSchedule from "../../../DB/models/userSchedule.model.js";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import moment from "moment";

//===================== create General Schedule API===============================
export const createGeneralSchedule = async (req, res) => {
    const { year, group_name, schedule } = req.body;

    // Fetch all groups with the given name
    const groups = await Group.find({ name: group_name });
    if (groups.length === 0) {
        return res.status(404).json({ message: "Group not found" });
    }

    // Get all group IDs
    const groupIds = groups.map(group => group._id);

    // Find all subjects that have any of these group IDs
    const subjects = await Subject.find({ groups: { $in: groupIds } }).select("_id");

    if (subjects.length === 0) {
        return res.status(400).json({ message: "No subjects found for this group" });
    }

    // Validate that all provided subject_ids exist within the subjects found
    const subjectIds = subjects.map(sub => sub._id.toString());
    for (const entry of schedule) {
        if (!subjectIds.includes(entry.subject_id)) {
            return res.status(400).json({ message: `Subject ${entry.subject_id} is not associated with group ${group_name}` });
        }
    }

    // Create and save the general schedule
    const newSchedule = await GeneralSchedule.create({ year, group_name, schedule });

    res.status(201).json({ message: "General schedule created successfully", data: newSchedule });
};


//===================== Update General Schedule API===============================
export const updateGeneralSchedule = async (req, res) => {
    const { schedule_id, year, schedule } = req.body;
  
    // Ensure the schedule entry exists
    const existingSchedule = await GeneralSchedule.findById(schedule_id);
    if (!existingSchedule) {
      return res.status(404).json({ message: "General schedule not found" });
    }
  
    // Prepare update object
    const updateData = { year }; // Always update year
  
    // ✅ Only validate schedule if provided
    if (schedule) {
      // Extract group name from existing schedule
      const group_name = existingSchedule.group_name;
  
      // Find all subjects that contain a group with this name
      const groups = await Group.find({ name: group_name });
      if (groups.length === 0) {
        return res.status(400).json({ message: `No groups found with name ${group_name}` });
      }
  
      const groupIds = groups.map(group => group._id);
      const subjects = await Subject.find({ groups: { $in: groupIds } }).select("_id");
  
      if (subjects.length === 0) {
        return res.status(400).json({ message: `No subjects found for group ${group_name}` });
      }
  
      // Validate that all provided subject_ids exist within the subjects found
      const subjectIds = subjects.map(sub => sub._id.toString());
      for (const entry of schedule) {
        if (!subjectIds.includes(entry.subject_id)) {
          return res.status(400).json({ message: `Subject ${entry.subject_id} is not associated with group ${group_name}` });
        }
      }
  
      updateData.schedule = schedule; // ✅ Update schedule only if provided
    }
  
    // Update the general schedule
    const updatedSchedule = await GeneralSchedule.findByIdAndUpdate(schedule_id, updateData, { new: true });
  
    res.status(200).json({ message: "General schedule updated successfully", data: updatedSchedule });
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


//===================== delete general Schedule API===============================
  export const deleteGeneralSchedule = async (req, res) => {
    const { schedule_id } = req.params;
  
    const deletedSchedule = await GeneralSchedule.findById({ _id: schedule_id });
  
    if (deletedSchedule.deletedCount === 0) {
      return res.status(404).json({ message: "General Schedule not found" });
    }
  
    return res.status(200).json({ message: "General Schedule deleted successfully" });
  };


//================= Create User Schedule API=========================
export const createUserSchedule = async (req, res) => {
  const { schedule } = req.body;
  const user_id = req.authUser._id;

  // Get all valid subjects from General Schedules
  const generalSchedules = await GeneralSchedule.find({}, "schedule.subject_id");
  const validSubjects = new Set(generalSchedules.flatMap(gs => gs.schedule.map(s => s.subject_id.toString())));

  // Fetch the user's existing schedule
  let userSchedule = await UserSchedule.findOne({ user_id });

  // Initialize arrays for valid and rejected subjects
  const validSchedule = [];
  const rejectedSubjects = [];

  for (const entry of schedule) {
    const { subject_id, day, startTime, endTime } = entry;

    // Check if the subject exists in General Schedules
    if (!validSubjects.has(subject_id)) {
      rejectedSubjects.push({ subject_id, reason: "Subject is not part of any general schedule" });
      continue;
    }

    // Check for overlapping time slots
    if (userSchedule) {
      const hasConflict = userSchedule.schedule.some(existingEntry =>
        existingEntry.day === day &&
        !(
          endTime <= existingEntry.startTime || // New lecture ends before existing lecture starts
          startTime >= existingEntry.endTime   // New lecture starts after existing lecture ends
        )
      );

      if (hasConflict) {
        rejectedSubjects.push({ subject_id, reason: "Time slot conflict with an existing lecture" });
        continue;
      }
    }

    // If no conflict, add to valid schedule
    validSchedule.push(entry);
  }

  // If no valid subjects, return an error
  if (validSchedule.length === 0) {
    return res.status(400).json({ message: "All provided subjects have conflicts or are invalid.", rejectedSubjects });
  }

  // If user already has a schedule, update it
  if (userSchedule) {
    userSchedule.schedule.push(...validSchedule);
  } else {
    userSchedule = new UserSchedule({ user_id, schedule: validSchedule });
  }

  // Save the updated schedule
  await userSchedule.save();

  res.status(201).json({
    message: "User schedule created successfully",
    rejectedSubjects,
    schedule: userSchedule.schedule
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