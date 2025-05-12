import Semester from "../../../DB/models/semster.model.js";

export const addSemester = async (req, res) => {
  const { name, academicYear, startDate, endDate, offWeeks = [], isCurrent = false } = req.body;

  // Ensure startDate and endDate are parsed into Date objects
  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);

  if (isNaN(parsedStart) || isNaN(parsedEnd)) {
    return res.status(400).json({ message: "Start and end dates must be valid date strings." });
  }

  if (parsedStart >= parsedEnd) {
    return res.status(400).json({ message: "Start date must be before end date." });
  }

  // Check for existing semester (case-insensitive)
  const existingSemester = await Semester.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existingSemester) {
    return res.status(400).json({ message: "A semester with this name already exists." });
  }

  // Validate offWeeks range (1–14 only)
  const invalidWeeks = offWeeks.filter(week => week < 1 || week > 14);
  if (invalidWeeks.length > 0) {
    return res.status(400).json({
      message: `Off weeks must be between 1 and 14. Invalid weeks: ${invalidWeeks.join(", ")}`,
    });
  }

  const hasDuplicates = new Set(offWeeks).size !== offWeeks.length;
  if (hasDuplicates) {
    return res.status(400).json({ message: "Off weeks array contains duplicate values." });
  }

  // Create semester
  const semester = new Semester({
    name,
    academicYear,
    startDate: parsedStart,
    endDate: parsedEnd,
    offWeeks,
    isCurrent,
  });

  await semester.save();

  return res.status(201).json({
    message: "Semester created successfully.",
    semester,
  });
};
