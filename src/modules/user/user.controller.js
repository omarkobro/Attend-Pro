import User from "../../../DB/models/user.model.js";
import Student from "../../../DB/models/student.model.js";
import Staff from "../../../DB/models/staff.model.js";

export const getMyProfile = async (req, res) => {
  const authUser = req.authUser;

  let profileData = {};

  if (authUser.role === "student") {
    const student = await Student.findOne({ user_id: authUser._id }).populate({
      path: "department",
      select: "name", 
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    profileData = {
      user: {
        _id: authUser._id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phoneNumber: authUser.phoneNumber,
        role: authUser.role,
      },
      student: {
        _id: student._id,
        student_id: student.student_id,
        rfid_tag: student.rfid_tag,
        department: student.department
          ? {
              _id: student.department._id,
              name: student.department.name,
            }
          : null,
        year: student.year,
      },
    };
  } else if (authUser.role === "staff" || authUser.role === "admin") {
    const staff = await Staff.findOne({ user_id: authUser._id }).populate({
      path: "department",
      select: "name",
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found." });
    }

    profileData = {
      user: {
        _id: authUser._id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phoneNumber: authUser.phoneNumber,
        role: authUser.role,
        profilePicture: authUser.pfp
      },
      staff: {
        _id: staff._id,
        staff_number: staff.staff_number,
        department: staff.department
          ? {
              _id: staff.department._id,
              name: staff.department.name,
            }
          : null,
        position: staff.position,
      },
    };
  } else {
    return res.status(400).json({ message: "Role Not Found" });
  }

  res.status(200).json(profileData);
};
