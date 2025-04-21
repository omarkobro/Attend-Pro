import mongoose from "mongoose";
import Group from "../../../DB/models/group.model.js";
import Subject from "../../../DB/models/subject.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { sendEmail } from "../../services/send-emails.service.js";

import Student from "../../../DB/models/student.model.js";
import Staff from "../../../DB/models/staff.model.js";


//========================= Create Group API ==============================
export const createGroup = async (req, res, next) => {
    const { name, subject_id } = req.body;

    const subject = await Subject.findById(subject_id);
    if (!subject) {
        return next(new Error("Subject not found", { cause: 404 }));
    }

    const existingGroup = await Group.findOne({ name, subject_id });
    if (existingGroup) {
        return next(new Error("A group with this name already exists under the same subject.", { cause: 400 }));
    }

    const newGroup = await Group.create({ name, subject_id });

    await Subject.findByIdAndUpdate(
        subject_id,
        { $push: { groups: newGroup._id } },
        { new: true }
    );

    return res.status(201).json({
        message: "Group created successfully",
        group: newGroup,
    });
};


//========================= Get All Groups API ==============================
export const getAllGroups = async (req, res, next) => {
    const { subject_code, name, sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    const filter = {};
    if (subject_code) {
        const subject = await Subject.findOne({ code: subject_code }).select("_id");
        if (!subject) {
            return next(new Error("Subject with this code not found.", { cause: 404 }));
        }
        filter.subject_id = subject._id;
    }
    if (name) {
        filter.name = { $regex: new RegExp(name, "i") };
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;
    const sortOrder = order === "asc" ? 1 : -1;

    // Use projection to avoid unnecessary data fetching
    const groups = await Group.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .populate("subject_id", "name code")
        .lean();

    const totalGroups = await Group.countDocuments(filter);
    const deactivatedGroups = groups.filter(group => group.isDeleted).length;

    return res.status(200).json({
        message: deactivatedGroups > 0
            ? "Groups retrieved successfully. Some groups are deactivated."
            : "Groups retrieved successfully.",
        totalGroups,
        deactivatedGroups,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalGroups / pageSize),
        groups,
    });
};


//========================= Get Group By ID API ==============================
export const getGroupById = async (req, res, next) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate({
            path: "subject_id",
            select: "name code department",
            populate: { path: "department", select: "name code" },
        })
        .populate({
            path: "students",
            select: "user_id student_name student_id rfid_tag",
            populate: { path: "user_id", select: "email" },
        })
        .populate({
            path: "staff",
            select: "user_id staff_name position",
            populate: { path: "user_id", select: "email" },
        });

    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }

    return res.status(200).json({
        message: group.isDeleted ? "Group is deactivated." : "Group retrieved successfully.",
        isDeleted: group.isDeleted, 
        group,
    });
};

//========================= Update Group API ==============================
export const updateGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }

    const isDeactivated = group.isDeleted;

    if (name && name !== group.name) {
        const existingGroup = await Group.findOne({ name, subject_id: group.subject_id });
        if (existingGroup && existingGroup._id.toString() !== groupId) {            
            return next(new Error("A group with this name already exists under the same subject.", { cause: 400 }));
        }
        group.name = name;
        await group.save();  // ✅ Only save if a change occurred
    }

    return res.status(200).json({
        message: isDeactivated 
            ? "Group updated successfully, but this group is deactivated." 
            : "Group updated successfully.",
        group: {
            ...group.toObject(),
            isDeleted: isDeactivated, 
        },
    });
};


//========================= Deactivate Group API (No Transactions) ==============================
export const deactivateGroup = async (req, res, next) => {
    const { groupId } = req.params;

    // ✅ 1️⃣ Find the group first (without updating)
    const group = await Group.findById(groupId).populate([
        { path: "students", populate: { path: "user_id", select: "email" } },
        { path: "staff.staff_id", populate: { path: "user_id", select: "email" } },
    ]);

    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }

    // ✅ Prevent re-deactivation
    if (group.isDeleted) {
        return next(new Error("This group is already deactivated.", { cause: 400 }));
    }

    // ✅ 2️⃣ Update the group (set isDeleted to true)
    group.isDeleted = true;
    await group.save();

    // ✅ 3️⃣ Soft disassociate students (Staff update removed)
    await Student.updateMany(
        { _id: { $in: group.students } },
        { $pull: { groups: groupId } }
    );

    // ✅ 4️⃣ Notify students
    const studentNotifications = group.students.map((student) => ({
        recipient: student.user_id,
        title: "Group Deactivated",
        message: `Your group "${group.name}" has been deactivated. Please contact your academic advisor.`,
        type: "system",
        related_data: { groupId },
    }));

    await Notification.insertMany(studentNotifications);

    // ✅ 5️⃣ Send emails to staff (batch processing)
    const staffEmails = group.staff.map(staff => staff.staff_id.user_id.email);
    
    if (staffEmails.length > 0) {
        await sendBulkEmails(staffEmails, group.name);
    }

    return res.status(200).json({
        message: "Group deactivated successfully.",
        group,
    });
};


//========================= Send Bulk Emails to Staff ==============================
const sendBulkEmails = async (emails, groupName) => {
    try {
        if (!emails || emails.length === 0) {
            console.log("No valid emails found. Skipping email sending.");
            return;
        }

        const emailPromises = emails.map(email =>
            sendEmail({
                to: email,
                subject: `Group ${groupName} has been deactivated`,
                message: `Dear Staff,\n\nThe group "${groupName}" has been deactivated. If you have any concerns, please contact the administration.\n\nBest regards,\nUniversity Administration`,
            })
        );

        await Promise.all(emailPromises);
        console.log("Emails sent successfully.");
    } catch (error) {
        console.error("Error sending emails:", error);
        throw new Error("an Error has occured during sending emails but group has been successfully deactivated", { cause: 400 })
    }
}; 


//========================= Activate Group API ==============================
export const activateGroup = async (req, res, next) => {
    const { groupId } = req.params;

    // ✅ 1️⃣ Find the group first (without updating)
    const group = await Group.findById(groupId).populate([
        { path: "students", populate: { path: "user_id", select: "email" } },
        { path: "staff.staff_id", populate: { path: "user_id", select: "email" } },
    ]);

    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }

    // ✅ Prevent re-activation
    if (!group.isDeleted) {
        return next(new Error("This group is already active.", { cause: 400 }));
    }

    // ✅ 2️⃣ Update the group (set isDeleted to false)
    group.isDeleted = false;
    await group.save();

    // ✅ 3️⃣ Re-associate students with the group
    await Student.updateMany(
        { _id: { $in: group.students } },
        { $addToSet: { groups: groupId } } // Prevents duplicates
    );

    // ✅ 4️⃣ Notify students
    const studentNotifications = group.students.map((student) => ({
        recipient: student.user_id,
        title: "Group Reactivated",
        message: `Your group "${group.name}" has been reactivated. You can now resume your coursework.`,
        type: "system",
        related_data: { groupId },
    }));

    await Notification.insertMany(studentNotifications);

    // ✅ 5️⃣ Send emails to staff (batch processing)
    const staffEmails = group.staff.map(staff => staff.staff_id.user_id.email);

    if (staffEmails.length > 0) {
        await sendBulkEmailsForActivation(staffEmails, group.name);
    }

    return res.status(200).json({
        message: "Group activated successfully.",
        group,
    });
};

// ========================= Send Bulk Emails to Staff ==============================
const sendBulkEmailsForActivation = async (emails, groupName) => {
    try {
        if (!emails || emails.length === 0) {
            console.log("No valid emails found. Skipping email sending.");
            return;
        }

        const emailPromises = emails.map(email =>
            sendEmail({
                to: email,
                subject: `Group ${groupName} has been reactivated`,
                message: `Dear Staff,\n\nThe group "${groupName}" has been reactivated. If you have any concerns, please contact the administration.\n\nBest regards,\nUniversity Administration`,
            })
        );

        await Promise.all(emailPromises);
        console.log("Emails sent successfully.");
    } catch (error) {
        console.error("Error sending emails:", error);
        throw new Error("An error occurred during email sending, but the group has been successfully activated.", { cause: 400 });
    }
};



//========================= Add Student to group ==============================
export const addStudentToGroup = async (req, res, next) => {
    const { groupId, studentId } = req.body;

    // ✅ 1️⃣ Check if the group exists
    const group = await Group.findById(groupId).populate("subject_id");
    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }

    // ✅ 2️⃣ Check if the student exists
    const student = await Student.findById(studentId).populate("user_id", "email");
    if (!student) {
        return next(new Error("Student not found.", { cause: 404 }));
    }

    // ✅ 3️⃣ Ensure the student is not already in the group
    if (group.students.includes(studentId)) {
        return next(new Error("Student is already in this group.", { cause: 400 }));
    }

    // ✅ 4️⃣ Ensure the student is not in another group for the same subject
    const existingGroup = await Group.findOne({
        subject_id: group.subject_id._id,
        students: studentId,
    });

    if (existingGroup) {
        return next(new Error("Student is already assigned to another group for this subject.", { cause: 400 }));
    }

    // ✅ 5️⃣ Add the student to the group
    group.students.push(studentId);
    await group.save();

    // ✅ 6️⃣ Update the student’s groups array
    student.groups.push(groupId);
    await student.save();

    // ✅ 7️⃣ Send a notification to the student
    await Notification.create({
        recipient: student.user_id,
        title: "Added to Group",
        message: `You have been added to the group "${group.name}" for the subject "${group.subject_id.name}".`,
        type: "system",
        related_data: { groupId },
    });

    return res.status(200).json({
        message: "Student added to the group successfully.",
        group,
    });
};


//========================= Remove Student from group =======================
export const removeStudentFromGroup = async (req, res,next) => {
    const { group_id, student_id } = req.body;
  
    // 1. Find the Group
    const group = await Group.findById(group_id);
    console.log(group);
    
    if (!group) {
        return next(new Error("Group not found.", { cause: 404 }));
    }
    // 1.1 Find the Group
    if(group.isDeleted){
        return next(new Error("This Group is deactivated", { cause: 404 }));
    }
  
    // 2. Check if the Student is in the Group
    if (!group.students.includes(student_id)) {
        return next(new Error("sudent is not assigned to this group", { cause: 400 }));
    }
  
    // 3. Remove Student from Group
    group.students = group.students.filter(id => id.toString() !== student_id);
    await group.save();
  
    // 4. Remove Group from Student's Groups Array
    await Student.findByIdAndUpdate(student_id, {
      $pull: { groups: group_id }
    });
  
    return res.status(200).json({
      success: true,
      message: "Student removed from the group successfully"
    });
  };
  

//======================== Get Students For a group ==============================

export const getStudentsInGroup = async (req, res) => {
    const { groupId } = req.params;
        
    // Step 1: Check if the group exists and is not deleted
    const group = await Group.findOne({ _id: groupId, isDeleted: false }).populate("students");
    
    if (!group) {
      return res.status(404).json({ status: "error", message: "Group not found" });
    }
  
    // Step 2: Authorization - Only admins or assigned staff can access

    
    const userRole = req.authUser.role;
    const userId = req.authUser._id;
  
    const isAuthorized =
      userRole === "admin" || group.staff.some((s) => s.staff_id.toString() === userId.toString());
  
    if (!isAuthorized) {
      return res.status(403).json({ status: "error", message: "Unauthorized access" });
    }
  
    // Step 3: Retrieve and format student data
    const students = await Student.find({ _id: { $in: group.students } })
      .populate({
        path: "user_id",
        select: "email university_email pfp",
      })
      .select("student_name student_id rfid_tag user_id");

    const formattedStudents = students.map((student) => ({
      student_id: student.student_id,
      student_name: student.student_name,
      rfid_tag: student.rfid_tag,
      email: student.user_id?.email,
      university_email: student.user_id?.university_email,
      pfp: student.user_id?.pfp,
    }));
    
    return res.status(200).json({
      status: "success",
      data: {
        groupId,
        students: formattedStudents,
      },
    });
  }; 

// =========================== Assign Staff to group ==============================

export const assignStaffToGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { staffId, role } = req.body;
  
    // 1️⃣ Check if the group exists and is not deleted
    const group = await Group.findOne({ _id: groupId, isDeleted: false });
    if (!group) {
      return next(new Error("Group not found or has been deleted", { cause: 404 }));
    }
  
    // 2️⃣ Check if the staff exists
    const staff = await Staff.findById(staffId).populate("user_id", "email staff_name");
    if (!staff) {
      return next(new Error("Staff member not found", { cause: 404 }));
    }
  
    // 3️⃣ Check if the staff is already assigned to the group
    const isAlreadyAssigned = group.staff.some((s) => s.staff_id.equals(staffId));
    if (isAlreadyAssigned) {
      return next(new Error("Staff is already assigned to this group", { cause: 400 }));
    }
  
    // 4️⃣ If role is 'lecturer', ensure no other lecturer exists in the group
    if (role === "lecturer") {
      const hasLecturer = group.staff.some((s) => s.role === "lecturer");
      if (hasLecturer) {
        return next(new Error("This group already has a lecturer", { cause: 400 }));
      }
    }
  
    // 5️⃣ Assign the staff to the group
    group.staff.push({ staff_id: staffId, role });
    await group.save();
  
    // 6️⃣ Update staff's subjects array (if not already assigned)
    if (!staff.subjects.includes(group.subject_id)) {
      staff.subjects.push(group.subject_id);
      await staff.save();
    }
  
    // 7️⃣ Fetch subject details
    const subject = await Subject.findById(group.subject_id).select("name");
    if (!subject) {
      return next(new Error("Subject not found", { cause: 404 }));
    }
  
    // 8️⃣ Send email notification to the staff
    const emailContent = `
      <p>Dear ${staff.staff_name},</p>
      <p>You have been assigned to a new group:</p>
      <ul>
        <li><strong>Subject:</strong> ${subject.name}</li>
        <li><strong>Group:</strong> ${group.name}</li>
        <li><strong>Role:</strong> ${role}</li>
      </ul>
      <p>Please check your dashboard for more details.</p>
      <p>Best regards,<br>University Administration</p>
    `;

    try {
      await sendEmail({
        to: staff.user_id.email,
        subject: "New Group Assignment",
        message: emailContent 
    });
      
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  
    return res.status(200).json({
      status: "success",
      message: "Staff assigned to group successfully",
      data: {
        groupId: group._id,
        staff: group.staff.map(({ staff_id, role }) => ({ staff_id, role })),
      },
    });
  };

//====================== Remove Staff From Group ==========================

export const removeStaffFromGroup = async (req, res, next) => {
    const { groupId, staffId } = req.params;
  
    // 1️⃣ Check if the Group Exists
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new Error("Group not found", { cause: 404 }));
    }
  
    // 2️⃣ Check if the Group is Active
    if (group.isDeleted) {
      return next(new Error("Group has been deleted", { cause: 400 }));
    }
  
    // 3️⃣ Check if the Staff Exists in the Group
    const staffIndex = group.staff.findIndex((s) => s.staff_id.equals(staffId));
    if (staffIndex === -1) {
      return next(new Error("Staff is not assigned to this group", { cause: 400 }));
    }
  
    // 4️⃣ Remove Staff from the Group
    group.staff.splice(staffIndex, 1);
    await group.save();
  
    // 5️⃣ Check if Staff Teaches Other Groups in the Same Subject
    const subjectId = group.subject_id;
    const otherGroups = await Group.find({
      subject_id: subjectId,
      "staff.staff_id": staffId,
    });
  
    // 6️⃣ If Staff Has No Other Groups in the Subject, Remove Subject from Staff
    if (otherGroups.length === 0) {
      await Staff.findByIdAndUpdate(staffId, { $pull: { subjects: subjectId } });
    }
  
    // 7️⃣ Send Email Notification to Staff
    const staff = await Staff.findById(staffId).populate("user_id", "email firstName lastName");
    if (staff) {
      const emailContent = `
        <p>Dear ${staff.user_id.firstName} ${staff.user_id.lastName},</p>
        <p>You have been removed from the group <strong>${group.name}</strong> in subject <strong>${subjectId}</strong>.</p>
        ${otherGroups.length === 0 ? "<p>You are no longer assigned to this subject.</p>" : ""}
        <p>If you have any questions, please contact the administration.</p>
      `;
  
      await sendEmail({
        to: staff.user_id.email,
        subject: "Removed from Group Assignment",
        message: emailContent,
      });
    }
  
    // 8️⃣ Respond with Success
    return res.status(200).json({
      status: "success",
      message: "Staff removed from group successfully",
    });
  };

  //========================= get all staff for a group ============================

  export const getAllStaffForGroup = async (req, res, next) => {
    const { groupId } = req.params;
  
    // 1️⃣ Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new Error("Group not found", { cause: 404 }));
    }
  
    // 2️⃣ Populate staff details
    const populatedGroup = await Group.findById(groupId)
      .populate("staff.staff_id", "staff_name staff_number") // Selecting only necessary fields
      .lean(); // Convert to a plain object for better manipulation
  
    return res.status(200).json({
      status: "success",
      message: "Staff members retrieved successfully",
      data: {
        groupId: populatedGroup._id,
        staff: populatedGroup.staff.map(({ staff_id, role }) => ({
          staff_id: staff_id._id,
          staff_name: staff_id.staff_name,
          staff_number: staff_id.staff_number,
          role,
        })),
      },
    });
  };

//================ Get all Groups under a subject ===========================
export const getAllGroupsUnderSubject = async (req, res, next) => {
    const { subjectId } = req.params;
  
    // 1️⃣ Check if the subject exists and is not deleted
    const subject = await Subject.findOne({ _id: subjectId, isDeleted: false });
    if (!subject) {
      return next(new Error("Subject not found ", { cause: 404 }));
    }
  
    if (subject.isDeleted) {
      return next(new Error("Subject has been deleted", { cause: 400 }));
    }
  
    // 2️⃣ Fetch all groups under this subject that are not deleted
    const groups = await Group.find({ subject_id: subjectId, isDeleted: false })
      .select("-__v") // Exclude Mongoose versioning key
      .populate({
        path: "students",
        select: "student_name student_id",
      })
      .populate({
        path: "staff.staff_id",
        select: "staff_name staff_number",
      });
  
    // 3️⃣ Return the response
    return res.status(200).json({
      status: "success",
      message: "Groups retrieved successfully",
      data: groups,
    });
  };

//================ Delete Group From subject ===========================
export const deleteGroupFromSubject = async (req, res, next) => {
    const { groupId } = req.params;
  
    // 1️⃣ Validate if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new Error("Group not found", { cause: 404 }));
    }
  
    // 2️⃣ Ensure the group is not already deleted
    if (group.isDeleted) {
      return next(new Error("Group has already been deleted", { cause: 400 }));
    }
  
    // 3️⃣ Check if the group has any assigned students
    if (group.students.length > 0) {
      return next(new Error("Cannot delete group because students are assigned to it", { cause: 400 }));
    }
  
    // 4️⃣ Check if the group has any assigned staff
    if (group.staff.length > 0) {
      return next(new Error("Cannot delete group because staff members are assigned to it", { cause: 400 }));
    }
  
    // 5️⃣ Remove the group reference from the subject's `groups` array
    await Subject.updateOne({ _id: group.subject_id }, { $pull: { groups: groupId } });
  
    // 6️⃣ Delete the group from the database
    await Group.findByIdAndDelete(groupId);
  
    // 7️⃣ Return success response
    return res.status(200).json({
      status: "success",
      message: "Group successfully deleted from subject",
    });
  };


//======================= Remove all students from group API ===============================
export const removeAllStudentsFromGroup = async (req, res, next) => {
  const { groupId } = req.params;

  // 1️⃣ Check if the group exists (Allow deleted groups too)
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new Error("Group not found", { cause: 404 }));
  }

  // 2️⃣ Check if the group has students
  if (group.students.length === 0) {
    return next(new Error("No students assigned to this group", { cause: 400 }));
  }

  // 3️⃣ Remove the group reference from each student
  await Student.updateMany(
    { _id: { $in: group.students } }, 
    { $pull: { groups: groupId } }
  );

  // 4️⃣ Clear the students array in the group document
  group.students = [];
  await group.save();

  return res.status(200).json({
    status: "success",
    message: "All students have been removed from the group",
    data: {
      groupId: group._id,
      students: group.students, // Should be an empty array now
    },
  });
};

//============== Remove All Staff From Group API ======================
export const removeAllStaffFromGroup = async (req, res, next) => {
  const { groupId } = req.params;

  // 1️⃣ Check if the group exists (even if deleted)
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new Error("Group not found", { cause: 404 }));
  }

  // 2️⃣ Check if the group has any staff assigned
  if (group.staff.length === 0) {
    return next(new Error("No staff members assigned to this group", { cause: 400 }));
  }

  // 3️⃣ Extract all staff IDs
  const staffIds = group.staff.map((s) => s.staff_id);

  // 4️⃣ Update staff documents (remove group's subject from their `subjects` array)
  const subjectId = group.subject_id;
  await Staff.updateMany(
    { _id: { $in: staffIds } },
    { $pull: { subjects: subjectId } }
  );

  // 5️⃣ Send email notifications to removed staff
  for (const { staff_id } of group.staff) {
    const staff = await Staff.findById(staff_id).populate("user_id", "email");
    if (staff && staff.user_id?.email) {
      sendEmail({
        to: staff.user_id.email,
        subject: "You have been removed from a group",
        text: `Dear ${staff.staff_name},\n\nYou have been removed from the group "${group.name}". If you have any questions, please contact the administration.\n\nBest Regards,\nUniversity Admin Team`,
      });
    }
  }

  // 6️⃣ Clear the staff array in the group document
  group.staff = [];
  await group.save();

  return res.status(200).json({
    status: "success",
    message: "All staff members have been removed from the group",
    data: {
      groupId: group._id,
      staff: [],
    },
  });
};

