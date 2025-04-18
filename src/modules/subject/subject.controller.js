import Subject from "../../../DB/models/subject.model.js";
import Staff from "../../../DB/models/staff.model.js";
import Group from "../../../DB/models/group.model.js";
import Department from "../../../DB/models/department.model.js";
import Notification from "../../../DB/models/notification.model.js";
import { sendEmail } from "../../services/send-emails.service.js";


//============================== Create Subject API =======================
export const createSubject = async (req, res, next) => {
  let { name, code, department, year } = req.body;

  // Check if department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
      return next(new Error("Department not found", { cause: 404 }));
  }

  // Check if subject code already exists (case-insensitive)
  let existingSubject = await Subject.findOne({ code: code.toUpperCase() });
  if (existingSubject) {
      return next(new Error("Subject with this code already exists.", { cause: 409 }));
  }

  // Create new subject
  let newSubject = await Subject.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      department,
      year,
  });

  return res.status(201).json({
      success: true,
      message: "Subject created successfully.",
      data: newSubject,
  });
};



//============================== Update Subject API =======================
export const updateSubject = async (req, res, next) => {
  const { subjectId } = req.params;
  const { code, department } = req.body;

  // Find subject
  const subject = await Subject.findById(subjectId);
  if (!subject) {
      return next(new Error("Subject not found", { cause: 404 }));
  }

  // Check if department exists if provided
  if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
          return next(new Error("Department not found", { cause: 404 }));
      }
  }

  // Ensure unique code if updating
  if (code) {
      const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
      if (existingSubject && existingSubject._id.toString() !== subjectId) {
          return next(new Error("Subject with this code already exists.", { cause: 409 }));
      }
      req.body.code = code.toUpperCase().trim();
  }

  // Update subject
  const updatedSubject = await Subject.findByIdAndUpdate(subjectId, { $set: req.body }, { new: true, runValidators: true });

  return res.status(200).json({
      message: "Subject updated successfully",
      subject: updatedSubject,
  });
};


//============================== get All Subjects API =======================
export const getAllSubjects = async (req, res, next) => {
  try {
      let { page = 1, limit = 10, department, year } = req.query;
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, parseInt(limit));

      // Build filter
      let filter = {};
      if (department) filter.department = department;
      if (year) filter.year = parseInt(year);

      // Fetch subjects
      const subjects = await Subject.find(filter)
          .populate("groups", "name") // ✅ Correct: Groups belong to subjects
          .skip((page - 1) * limit)
          .limit(limit);

      // Count total
      const totalSubjects = await Subject.countDocuments(filter);

      return res.status(200).json({
          message: "Subjects retrieved successfully",
          page,
          totalPages: Math.ceil(totalSubjects / limit),
          totalSubjects,
          subjects,
      });
  } catch (error) {
      next(new Error("Error retrieving subjects", { cause: 500 }));
  }
};

//============================== get Subject by Id API =======================
export const getSubjectById = async (req, res, next) => {
  try {
      const { subjectId } = req.params;

      const subject = await Subject.findById(subjectId)
          .populate("groups", "name"); // ✅ Correct: Groups are linked to subjects

      if (!subject) {
          return next(new Error("Subject not found", { cause: 404 }));
      }

      res.status(200).json({
          message: "Subject retrieved successfully",
          subject,
      });
  } catch (error) {
      next(new Error("Error retrieving subject", { cause: 500 }));
  }
};


//============================== Delete Subject API =======================
export const deactivateSubject = async (req, res, next) => {
  const { subjectId } = req.params;

  // ✅ 1️⃣ Find the subject first (without updating)
  const subject = await Subject.findById(subjectId).populate({
      path: "groups",
      populate: [
          { path: "students", populate: { path: "user_id", select: "email" } },
          { path: "staff.staff_id", populate: { path: "user_id", select: "email" } },
      ],
  });

  if (!subject) {
      return next(new Error("Subject not found.", { cause: 404 }));
  }

  // ✅ Prevent re-deactivation
  if (subject.isDeleted) {
      return next(new Error("This subject is already deactivated.", { cause: 400 }));
  }

  // ✅ 2️⃣ Update the subject (set isDeleted to true)
  subject.isDeleted = true;
  await subject.save();

  // ✅ 3️⃣ Soft-deactivate all associated groups
  await Group.updateMany(
      { _id: { $in: subject.groups } },
      { $set: { isDeleted: true } }
  );

  // ✅ 4️⃣ Notify students in all associated groups
  const studentNotifications = subject.groups.flatMap(group => 
      group.students.map(student => ({
          recipient: student.user_id,
          title: "Subject Deactivated",
          message: `Your subject "${subject.name}" has been deactivated. Please contact your academic advisor for more details.`,
          type: "system",
          related_data: { subjectId },
      }))
  );

  await Notification.insertMany(studentNotifications);

  // ✅ 5️⃣ Send emails to associated staff (batch processing)
  const staffEmails = subject.groups.flatMap(group => 
      group.staff.map(staff => staff.staff_id.user_id.email)
  ).filter(email => email);

  if (staffEmails.length > 0) {
      await sendBulkEmails(staffEmails, subject.name);
  }

  return res.status(200).json({
      message: "Subject deactivated successfully.",
      subject,
  });
};

//========================= Send Bulk Emails to Staff ==============================
const sendBulkEmails = async (emails, subjectName) => {
  try {
      if (!emails || emails.length === 0) {
          console.log("No valid emails found. Skipping email sending.");
          return;
      }

      const emailPromises = emails.map(email =>
          sendEmail({
              to: email,
              subject: `Subject ${subjectName} has been deactivated`,
              message: `Dear Staff,\n\nThe subject "${subjectName}" has been deactivated. If you have any concerns, please contact the administration.\n\nBest regards,\nUniversity Administration`,
          })
      );

      await Promise.all(emailPromises);
      console.log("Emails sent successfully.");
  } catch (error) {
      console.error("Error sending emails:", error);
      throw new Error("An error occurred while sending emails, but the subject has been successfully deactivated", { cause: 400 });
  }
};


//============================== Activate Subject API =======================
export const activateSubject = async (req, res, next) => {
  const { subjectId } = req.params;

  // ✅ 1️⃣ Find the subject first (without updating)
  const subject = await Subject.findById(subjectId).populate({
    path: "groups",
    populate: [
      { path: "students", populate: { path: "user_id", select: "email" } },
      { path: "staff.staff_id", populate: { path: "user_id", select: "email" } },
    ],
  });

  if (!subject) {
    return next(new Error("Subject not found.", { cause: 404 }));
  }

  // ✅ Prevent re-activation
  if (!subject.isDeleted) {
    return next(new Error("This subject is already active.", { cause: 400 }));
  }

  // ✅ 2️⃣ Update the subject (set isDeleted to false)
  subject.isDeleted = false;
  await subject.save();

  // ✅ 3️⃣ Reactivate all associated groups
  await Group.updateMany(
    { _id: { $in: subject.groups } },
    { $set: { isDeleted: false } }
  );

  // ✅ 4️⃣ Notify students in all associated groups
  const studentNotifications = subject.groups.flatMap(group =>
    group.students.map(student => ({
      recipient: student.user_id,
      title: "Subject Reactivated",
      message: `Your subject "${subject.name}" has been reactivated. Please check the schedule for updates.`,
      type: "system",
      related_data: { subjectId },
    }))
  );

  await Notification.insertMany(studentNotifications);

  // ✅ 5️⃣ Send emails to associated staff (batch processing)
  const staffEmails = subject.groups.flatMap(group =>
    group.staff.map(staff => staff.staff_id.user_id.email)
  ).filter(email => email);

  if (staffEmails.length > 0) {
    await sendBulkEmailsV2(staffEmails, subject.name);
  }

  return res.status(200).json({
    message: "Subject activated successfully.",
    subject,
  });
};

//========================= Send Bulk Emails to Staff ==============================
const sendBulkEmailsV2 = async (emails, subjectName) => {
  try {
    if (!emails || emails.length === 0) {
      console.log("No valid emails found. Skipping email sending.");
      return;
    }

    const emailPromises = emails.map(email =>
      sendEmail({
        to: email,
        subject: `Subject ${subjectName} has been activated`,
        message: `Dear Staff,\n\nThe subject "${subjectName}" has been activated. Please check the schedule for updates.\n\nBest regards,\nUniversity Administration`,
      })
    );

    await Promise.all(emailPromises);
    console.log("Emails sent successfully.");
  } catch (error) {
    console.error("Error sending emails:", error);
    throw new Error("An error occurred while sending emails, but the subject has been successfully activated", { cause: 400 });
  }
};

//================================= Get all subjects for a staff memebr ==============================
export const getSubjectsForStaff = async (req, res) => {
  const { staff_id } = req.params;

  // 1. Check staff exists
  const staff = await Staff.findById(staff_id).lean();
  if (!staff) {
    return res.status(404).json({
      success: false,
      message: "Staff member not found.",
    });
  }

  // 2. If no subjects assigned
  if (!staff.subjects || staff.subjects.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No subjects assigned to this staff member.",
      subjects: [],
    });
  }

  // 3. Fetch and filter subjects that are not soft-deleted
  const subjects = await Subject.find({
    _id: { $in: staff.subjects },
    isDeleted: false,
  })
    .select("name code year department")
    .populate("department", "name") // Optional: Populate department name
    .lean();

  // 4. Return structured response
  return res.status(200).json({
    success: true,
    total: subjects.length,
    staff_id,
    subjects,
  });
};


// //==============================  Get All groups for a staff under a specific subject API =======================
export const getAssignedGroupsForStaff = async (req, res, next) => {
  const { staffId, subjectId } = req.params;

  const staff = await Staff.findById(staffId);
  if (!staff) {
    return next(new Error("Staff member not found", { cause: 404 }));
  }

  const subject = await Subject.findOne({ _id: subjectId, isDeleted: false });
  if (!subject) {
    return next(new Error("Subject not found or has been deleted", { cause: 404 }));
  }

  const assignedGroups = await Group.find({
    subject_id: subjectId,
    isDeleted: false,
    staff: { $elemMatch: { staff_id: staffId } },
  })
    .populate("subject_id", "name code") 
    .select("name subject_id staff"); 

  return res.status(200).json({
    status: "success",
    results: assignedGroups.length,
    data: assignedGroups,
  });
};



// //============================== ASSIGN Staff to Subjects  API =======================

// export const assignStaffToSubject = async (req, res, next) => {
//   try {
//     const { subjectId } = req.params;
//     const { staffId } = req.body;

//     // Check if the subject exists
//     const subject = await Subject.findById(subjectId);
//     if (!subject) {
//       return next(new Error("Subject not found", { cause: 404 }));
//     }

//     // Check if the staff exists
//     const staff = await Staff.findById(staffId);
//     if (!staff) {
//       return next(new Error("Staff member not found", { cause: 404 }));
//     }

//     // Check if the staff is already assigned to the subject
//     if (subject.staff.includes(staffId)) {
//       return next(
//         new Error("Staff member is already assigned to this subject", {
//           cause: 400,
//         })
//       );
//     }

//     // Assign staff to the subject
//     subject.staff.push(staffId);

//     // Assign subject to the staff's subjects array (Fixing the error here)
//     staff.subjects.push({ subject_id: subjectId });

//     // Save both documents in parallel for better performance
//     await Promise.all([subject.save(), staff.save()]);

//     const updatedSubject = await Subject.findById(subjectId).populate(
//       "staff",
//       "staff_name staff_number department position"
//     );

//     res.status(200).json({
//       message: "Staff assigned to subject successfully",
//       data: updatedSubject,
//     });
//   } catch (error) {
//     console.error("Error occurred:", error);
//     next(new Error("Error assigning staff to subject", { cause: 500 }));
//   }
// };


// //============================== remove Staff From Subject API =======================
// export const removeStaffFromSubject = async (req, res, next) => {
//   try {
//     const { subjectId, staffId } = req.params;

//     // Find staff and populate the associated user (for email)
//     const staff = await Staff.findById(staffId).populate("user_id", "email");
//     if (!staff || !staff.user_id || !staff.user_id.email) {
//       return next(new Error("Staff email not found", { cause: 400 }));
//     }

//     // Find the subject
//     const subject = await Subject.findById(subjectId);
//     if (!subject) {
//       return next(new Error("Subject not found", { cause: 404 }));
//     }

//     // Check if staff is assigned to the subject
//     if (!subject.staff.includes(staffId)) {
//       return next(
//         new Error("Staff is not assigned to this subject", { cause: 400 })
//       );
//     }

//     // Remove staff from the subject's staff array
//     subject.staff = subject.staff.filter((id) => id.toString() !== staffId);

    
    
//     // Remove subject from the staff's subjects array
//     staff.subjects = staff.subjects.filter(subject => subject.subject_id.toString() !== subjectId);
    
    
//     // Save both documents in parallel for better performance
//     await Promise.all([subject.save(), staff.save()]);
    
//     // Send email notification
//     await sendEmail({
//       to: staff.user_id.email, // Get email from the populated User schema
//       subject: "Subject Unassignment Notice",
//       message: `Dear ${staff.staff_name},\n\nYou have been removed from the subject ${subject.name}. If you have any questions, please contact the administration.\n\nBest regards,\nUniversity Administration`,
//     });

//     res.status(200).json({
//       message: "Staff removed from subject successfully and notified",
//       data: await Subject.findById(subjectId).populate("staff", "staff_name staff_number department position"),
//     });
//   } catch (error) {
//     next(new Error("Error removing staff from subject", { cause: 500 }));
//   }
// };

// ============================== Assign Group to Subject API =======================
// export const assignGroupToSubject = async (req, res, next) => {
//   const { subjectId, groupId } = req.params;

//   // ✅ Validate Subject existence
//   const subject = await Subject.findById(subjectId);
//   if (!subject) {
//     return next(new Error("Subject not found", { cause: 404 }));
//   }

//   // ✅ Validate Group existence
//   const group = await Group.findById(groupId);
//   if (!group) {
//     return next(new Error("Group not found", { cause: 404 }));
//   }

//   // ✅ Ensure the group is not already assigned to another subject
//   if (group.subject_id && group.subject_id.toString() !== subjectId) {
//     return next(new Error("This group is already assigned to another subject", { cause: 400 }));
//   }

//   // ✅ Check if the group is already assigned to the subject
//   if (subject.groups.includes(groupId)) {
//     return next(new Error("Group is already assigned to this subject", { cause: 400 }));
//   }

//   // ✅ Assign group to subject
//   subject.groups.push(group._id);
//   group.subject_id = subject._id; // Ensure consistency in Group schema
//   await Promise.all([subject.save(), group.save()]);

//   return res.status(200).json({
//     message: "Group assigned to subject successfully",
//     data: await Subject.findById(subjectId).populate("groups", "name"),
//   });
// };



// // ============================== Remove Group from Subject API =======================
// export const removeGroupFromSubject = async (req, res, next) => {
//   const { subjectId, groupId } = req.params;

//   // ✅ Validate Subject existence
//   const subject = await Subject.findById(subjectId);
//   if (!subject) {
//     return next(new Error("Subject not found", { cause: 404 }));
//   }

//   // ✅ Validate Group existence
//   const group = await Group.findById(groupId);
//   if (!group) {
//     return next(new Error("Group not found", { cause: 404 }));
//   }

//   // ✅ Ensure the group is assigned to this subject
//   if (!subject.groups.includes(groupId)) {
//     return next(new Error("This group is not assigned to the specified subject", { cause: 400 }));
//   }

//   // ✅ Prevent removal if the group still has students or staff
//   if (group.students.length > 0 || group.staff.length > 0) {
//     return next(new Error("Cannot remove this group. Please remove all students and staff from the group first.", { cause: 400 }));
//   }

//   // ✅ Remove group from subject
//   subject.groups = subject.groups.filter(id => id.toString() !== groupId);

//   // ✅ Clear the subject field in the group
//   group.subject_id = null;

//   await Promise.all([subject.save(), group.save()]);

//   return res.status(200).json({
//     message: "Group removed from subject successfully",
//     data: await Subject.findById(subjectId).populate("groups", "name"),
//   });
// };
