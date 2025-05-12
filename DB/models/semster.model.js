import mongoose, { model, Schema } from "mongoose";

// Helper function to calculate total weeks
const calculateTotalWeeks = (startDate, endDate) => {
  const diffInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  return Math.ceil(diffInDays / 7); // Rounding up to include any partial weeks
};

const semesterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // e.g., "Fall 2024"
    trim: true,
  },
  academicYear: {
    type: String, // Optional, for future filtering
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  offWeeks: [{
    type: Number,
    validate: {
      validator: (v) => v >= 1 && v <= 14, // Ensure off weeks are within a reasonable range
      message: 'Invalid off week number, please insure that week numbers are between 1 and 14 '
    }
  }],
  isCurrent: {
    type: Boolean,
    default: false,
  },
  totalWeeks: {
    type: Number,
    default: function () {
      return calculateTotalWeeks(new Date(this.startDate), new Date(this.endDate)); // Calculate total weeks based on dates
    }
  }
}, { timestamps: true });

// Method to get the current week for the semester
semesterSchema.methods.getCurrentWeek = function () {
  return getWeekNumber(new Date(), this); // Calls the helper function with the current date
};

export default mongoose.models.Semester || model("Semester", semesterSchema);
