import dotenv from "dotenv";
import User from "../../../DB/models/user.model.js";
import Student from "../../../DB/models/student.model.js";
import Staff from "../../../DB/models/staff.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../services/send-emails.service.js";
import allowedStaffModel from "../../../DB/models/allowedStaff.model.js";
import refreshTokensModel from "../../../DB/models/refreshTokens.model.js";

dotenv.config();
const cloudinary = cloudinaryConnection();

// Student Sign-Up API
export const signUpStudent = async (req, res, next) => {
  const email = req.body.email?.toLowerCase();
  const university_email = req.body.university_email?.toLowerCase();
  const {
    password,
    firstName,
    lastName,
    phoneNumber,
    // department,
    // year 
  } = req.body;
  // 1. Check for existing user (by email or university email)
  const emailExist = await User.findOne({ email });
  if (emailExist) {
    return res
      .status(400)
      .json({ message: "User with this email already exists." });
  }

  if (university_email) {
    const uniEmailExist = await User.findOne({ university_email });
    if (uniEmailExist) {
      return res
        .status(400)
        .json({ message: "University email already in use." });
    }
  }

  // 2. Hash Password
  const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);

  // 3. Initialize Profile Picture Object
  let pfp = { secure_url: null, public_id: null };

  // 4. Handle Profile Picture Upload
  try {
    if (req.file) {
      if (req.file?.size > 5 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "File size exceeds the 5MB limit." });
      }

      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.file.path,
        {
          folder: "Attend Pro/students/profile_pictures",
          use_filename: true,
        }
      );

      pfp = { secure_url, public_id };
    }
  } catch (error) {
    if (error.name === "MulterError") {
      return res
        .status(400)
        .json({ message: "File upload failed. Please try again." });
    }

    console.error("Cloudinary upload failed:", error);
    return next(new Error("Failed to upload profile picture."));
  }

  // 5. Create User
  const user = new User({
    email,
    university_email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    role: "student",
    pfp,
  });

  // 6. Save User with Rollback Handling
  try {
    await user.save();
  } catch (error) {
    console.error("Failed to save user:", error);
    if (pfp.public_id) await cloudinary.uploader.destroy(pfp.public_id);
    return next(new Error("Failed to register user."));
  }

  // 7. Create Student Record
  const student = new Student({
    user_id: user._id,
    student_name: `${firstName} ${lastName}`,
    department : "65f0a1b6c5a2f0a1b6c5a2f1",
    groups: [],
  });

  try {
    await student.save();
  } catch (error) {
    console.error("Failed to save student record:", error);
    await User.findByIdAndDelete(user._id);
    if (pfp.public_id) await cloudinary.uploader.destroy(pfp.public_id);
    return next(new Error("Failed to create student profile."));
  }

  // 8. Generate JWT Token for Email Verification
  const token = jwt.sign({ university_email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  const verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-account?token=${token}`;
  const emailMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Account</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin-top: 30px;">
    <tr>
      <td style="background-color: #2b7cff; padding: 20px 30px; color: white; text-align: center;">
        <h1 style="margin: 0;">Attend Pro</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2>Welcome, ${firstName}!</h2>
        <p style="font-size: 16px; color: #333;">
          Thank you for registering. Please confirm your university email by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2b7cff; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Account
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          Or copy and paste this link into your browser:<br />
          <a href="${verificationUrl}" style="color: #2b7cff;">${verificationUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 40px;">
          If you did not sign up for Attend Pro, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f4f4f4; text-align: center; padding: 20px; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Attend Pro. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const emailSent = await sendEmail({
    to: university_email,
    subject: "Verify Your Account",
    message: emailMessage,
  });

  if (!emailSent) {
    await User.findByIdAndDelete(user._id);
    await Student.findOneAndDelete({ user_id: user._id });
    if (pfp.public_id) await cloudinary.uploader.destroy(pfp.public_id);
    return next(new Error("Failed to send verification email."));
  }

  // 9. Response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    message: "Student registered successfully. Please verify your email.",
    user: userResponse,
  });
};


//================ Staff Sign-Up API ====================
export const signUpStaff = async (req, res, next) => {
  const email = req.body.email?.toLowerCase();
  const university_email = req.body.university_email?.toLowerCase();
  const { password, firstName, lastName, phoneNumber } = req.body;


  try {
    // 1. Check if staff is allowed to register
    const allowedStaff = await allowedStaffModel.findOne({ email });
    if (!allowedStaff) {
      return res.status(403).json({ message: "You are not allowed to register." });
    }

    // 2. Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { university_email }] });
    
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // 3. Hash Password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);

    // 4. Handle Profile Picture Upload
    let pfp = { secure_url: null, public_id: null };
    if (req.file) {
      try {
        if (req.file?.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: "File size exceeds the 5MB limit." });
        }
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
          folder: "Attend Pro/staff/profile_pictures",
          use_filename: true,
        });
        pfp = { secure_url, public_id };
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return next(new Error("Failed to upload profile picture."));
      }
    }

    // 5. Create User
    const user = new User({
      email,
      university_email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: allowedStaff.role, // Set role from allowedStaff
      pfp,
    });
    await user.save();

    // 6. Create Staff Record
    const staff = new Staff({
      user_id: user._id,
      staff_name: `${firstName} ${lastName}`,
      staff_number: Math.floor(100000 + Math.random() * 900000), // Temporary, admin will update
      department: allowedStaff.department, // Assigned from allowedStaff
      position: allowedStaff.position,
      subjects: [],
    });
    await staff.save();

    // 7. Send Email Verification
    const token = jwt.sign({ university_email }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-account?token=${token}`;
    const emailMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Account</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin-top: 30px;">
    <tr>
      <td style="background-color: #2b7cff; padding: 20px 30px; color: white; text-align: center;">
        <h1 style="margin: 0;">Attend Pro</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2>Welcome, ${firstName}!</h2>
        <p style="font-size: 16px; color: #333;">
          Thank you for registering. Please confirm your university email by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2b7cff; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Account
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          Or copy and paste this link into your browser:<br />
          <a href="${verificationUrl}" style="color: #2b7cff;">${verificationUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 40px;">
          If you did not sign up for Attend Pro, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f4f4f4; text-align: center; padding: 20px; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Attend Pro. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const emailSent = await sendEmail({
      to: university_email,
      subject: "Verify Your Account",
      message: emailMessage,
    });

    if (!emailSent) {
      await User.findByIdAndDelete(user._id);
      await Staff.findOneAndDelete({ user_id: user._id });
      if (pfp.public_id) await cloudinary.uploader.destroy(pfp.public_id);
      return next(new Error("Failed to send verification email."));
    }

    // 8. Response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "Staff registered successfully. Please verify your email.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in staff sign-up:", error);
    if (pfp?.public_id) await cloudinary.uploader.destroy(pfp.public_id);
    return next(new Error("Failed to register staff."));
  }
};

// //=========================  Verify Email ===============================
export const verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.query;

    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const university_email = decoded.university_email;

    // Find the user
    const user = await User.findOne({ university_email });

    if (!user) {
      return res.status(404).json({ err_msg: "User not found." });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ err_msg: "Account is already verified." });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({ msg: "Account verified successfully." });
  } catch (error) {
    return res.status(400).json({ err_msg: "Invalid or expired token." });
  }
};

// //========================= resend verification link  ===============================

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { university_email } = req.body;

    // Find the user by university email
    const user = await User.findOne({ university_email });

    if (!user) {
      return res.status(404).json({ err_msg: "User not found." });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ err_msg: "Account is already verified." });
    }

    // Generate new verification token
    const token = jwt.sign({ university_email: user.university_email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-account?token=${token}`;
    const emailMessage = `<p>Click here to verify your account: <a href="${verificationUrl}">Verify Account</a></p>`;

    // Send verification email
    const emailSent = await sendEmail({
      to: university_email,
      subject: "Resend Verification",
      message: emailMessage,
    });

    if (!emailSent) {
      return next(new Error("Failed to send verification email."));
    }

    res.status(200).json({ msg: "Verification email resent successfully." });
  } catch (error) {
    return next(error);
  }
};


// //=========================  Login ===============================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ err_msg: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ err_msg: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ err_msg: "Please verify your email before logging in." });
    }

    // Generate Access Token
    const accessToken = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.LOGIN_SECRET,
      { expiresIn: "1d" }
    );

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(40).toString("hex");

    // Save Refresh Token
    await refreshTokensModel.create({
      user_id: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Additional Role-Based Info
    let extra = null;

    if (user.role === "staff" || user.role === "admin") {
      extra = await Staff.findOne({ user_id: user._id }).lean();
    } else if (user.role === "student") {
      const student = await Student.findOne({ user_id: user._id }).select("_id").lean();
      if (student) {
        extra = { student_id: student._id };
      }
    }
    
    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        user_id: user._id,
        email: user.email,
        role: user.role,
        ...extra, // includes staff doc or student_id
      },
    });
  } catch (error) {
    return next(error);
  }
};

// //=========================  refresh token ===============================

export const refreshToken = async (req, res, next) => {
  try {
      const  {refreshToken}  = req.cookies;
      
      if (!refreshToken) {
          return res.status(401).json({ err_msg: "Refresh token required." });
      }

      // Find refresh token in DB
      const storedToken = await refreshTokensModel.findOne({ token: refreshToken });
      if (!storedToken || storedToken.expiresAt < new Date()) {
          return res.status(403).json({ err_msg: "Invalid or expired refresh token, Please Log In Again " });
      }

      // Get user data
      const user = await User.findById(storedToken.user_id);
      if (!user) {
          return res.status(403).json({ err_msg: "User not found." });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
          { user_id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
      );

      res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
      return next(error);
  }
};


// //=========================  Logout ===============================

export const logout = async (req, res, next) => {
  try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
          await refreshTokensModel.findOneAndDelete({ token: refreshToken });
      }

      res.clearCookie("refreshToken");
      res.status(200).json({ msg: "Logged out successfully." });
  } catch (error) {
      return next(error);
  }
};



// //=========================  forgot password ===============================

export const forgotPassword = async (req, res, next) => {
  try {
      const { email } = req.body;

      // 1. Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ err_msg: "User not found." });
      }

      // 2. Generate 4-digit OTP
      const OTP = crypto.randomInt(1000, 9999).toString();
      const expiresIn = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

      // 3. Update user with OTP & expiry time
      user.OTP = OTP;
      user.expiresIn = expiresIn;
      await user.save();

      // 4. Send OTP via email
      const emailMessage = `<p>Your password reset OTP is: <strong>${OTP}</strong></p>`;
      const emailSent = await sendEmail({
          to: user.email,
          subject: "Password Reset OTP",
          message: emailMessage,
      });

      if (!emailSent) {
          return res.status(500).json({ err_msg: "Failed to send OTP email." });
      }

      res.status(200).json({ msg: "OTP sent successfully." });
  } catch (error) {
      next(error);
  }
};



// //=========================  reset Password ===============================


export const resetPassword = async (req, res, next) => {
  try {
      const { email, OTP, newPassword } = req.body;

      // 1. Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ err_msg: "User not found." });
      }

      // 2. Validate OTP
      if (user.OTP !== OTP) {
          return res.status(400).json({ err_msg: "Invalid OTP." });
      }

      // 3. Check if OTP is expired
      if (user.expiresIn < new Date()) {
          return res.status(400).json({ err_msg: "OTP has expired. Request a new one." });
      }

      // 4. Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // 5. Update password and clear OTP fields
      user.password = hashedPassword;
      user.OTP = "";
      user.expiresIn = 0;
      await user.save();

      res.status(200).json({ msg: "Password reset successfully." });
  } catch (error) {
      next(error);
  }
};


// //=========================  resend OTP ===============================

export const resendOTP = async (req, res, next) => {
  try {
      const { email } = req.body;

      // 1. Find user
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ err_msg: "User not found." });
      }

      // 2. Check if OTP was sent within the last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (user.expiresIn > oneMinuteAgo) {
          return res.status(429).json({ err_msg: "Please wait before requesting a new OTP." });
      }

      // 3. Generate new 4-digit OTP
      const OTP = crypto.randomInt(1000, 9999).toString();
      const expiresIn = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

      // 4. Update user with new OTP
      user.OTP = OTP;
      user.expiresIn = expiresIn;
      await user.save();

      // 5. Send OTP via email
      const emailMessage = `<p>Your OTP for password reset is: <strong>${OTP}</strong></p>`;
      const emailSent = await sendEmail({ to: user.email, subject: "Resend OTP", message: emailMessage });

      if (!emailSent) {
          return res.status(500).json({ err_msg: "Failed to send OTP email." });
      }

      return res.status(200).json({ msg: "OTP resent successfully." });
  } catch (error) {
      next(error);
  }
};