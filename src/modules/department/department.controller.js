import Department from "../../../DB/models/department.model.js";


export const addDepartment = async (req, res) => {
    const { name, code } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({ 
        $or: [{ name }, { code }] 
    });

    if (existingDepartment) {
        return res.status(400).json({ message: "Department with this name or code already exists." });
    }

    const department = await Department.create({ name, code });

    res.status(201).json({ 
        message: "Department added successfully", 
        department 
    });
};
