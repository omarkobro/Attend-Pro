import allowedStaff from "../../../DB/models/allowedStaff.model.js";


export const addAllowedStaff = async (req, res) => {
  const { email, role, position, department } = req.body;
  const normalizedEmail = email.toLowerCase();

  // Check for duplicates
  const existing = await allowedStaff.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(409).json({ message: "This staff email is already allowed." });
    return;
  }

  // Create and save the allowed staff
  const newAllowed = await allowedStaff.create({
    email: normalizedEmail,
    role,
    position,
    department,
  });

  res.status(201).json({
    message: "Allowed staff added successfully.",
    allowedStaff: newAllowed,
  });
};
