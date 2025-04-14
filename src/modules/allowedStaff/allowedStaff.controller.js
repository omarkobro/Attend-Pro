import allowedStaff from "../../../DB/models/allowedStaff.model.js";

// @desc    Add new allowed staff
// @route   POST /api/allowedstaff
// @access  Admin Only
export const addAllowedStaff = async (req, res, next) => {
  try {
    const { email, role, position, department } = req.body;

    // Create and save allowed staff entry
    const newAllowedStaff = await allowedStaff.create({ email, role, position,department });

    res.status(201).json({
      message: "Allowed staff added successfully.",
      allowedStaff: newAllowedStaff,
    });

  } catch (error) {
    console.error("Error adding allowed staff:", error);
    next(new Error("Failed to add allowed staff."));
  }
};
