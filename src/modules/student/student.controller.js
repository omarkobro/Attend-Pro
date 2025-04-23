import Student from "../../../DB/models/student.model.js";
import GeneralSchedule from "../../../DB/models/generalSchedule.model.js";
import { AppError } from "../../utils/appError.js";

export const updateStudent = async (req, res) => {
  const { studentId } = req.params;
  const { student_id, rfid_tag } = req.body;

  try {
    // Find student by their ID
    const student = await Student.findOne({ _id: studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update the student fields
    student.student_id = student_id;
    student.rfid_tag = rfid_tag;

    // Save the updated student document
    await student.save();

    return res.status(200).json({ message: "Student information updated successfully", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating student information" });
  }
};

//================ Get Student Subjects With Details ================================
export const getStudentSubjectsWithDetails = async (req, res, next) => {
  const student = await Student.findOne({ user_id: req.authUser._id })
    .populate({
      path: "groups",
      match: { isDeleted: false },
      populate: [
        {
          path: "subject_id",
          populate: { path: "department" },
        },
        {
          path: "staff.staff_id",
          select: "staff_name",
        },
      ],
    })
    .lean();

  if (!student) {
    return next(new AppError("Student not found", 404));
  }

  const responseData = [];

  for (const group of student.groups) {
    const subject = group.subject_id;
    const groupName = group.name;

    // Get schedule by group name
    const generalSchedule = await GeneralSchedule.findOne({
      group_name: groupName,
    }).lean();

    let scheduleInfo = null;

    if (generalSchedule) {
      const subjectSchedule = generalSchedule.schedule.find((entry) =>
        entry.subject_id.toString() === subject._id.toString()
      );

      if (subjectSchedule) {
        scheduleInfo = {
          day: subjectSchedule.day,
          location: subjectSchedule.location || null,
        };
      }
    }

    responseData.push({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        department: subject.department?.name || null,
        year: subject.year,
      },
      group: {
        name: group.name,
      },
      instructors: group.staff.map((s) => ({
        id: s.staff_id._id,
        name: s.staff_id.staff_name,
        role: s.role,
      })),
      schedule: scheduleInfo,
    });
  }

  res.status(200).json({
    status: "success",
    results: responseData.length,
    data: responseData,
  });
};
