import Student from "../../../DB/models/student.model.js";

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
