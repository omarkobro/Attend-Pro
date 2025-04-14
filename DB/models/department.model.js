import mongoose, { model, Schema } from "mongoose";

const departmentSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true }, // "Computer Science"
    code: { type: String, required: true, unique: true, uppercase: true, trim: true } // "CS"
  }, { timestamps: true });
  
  export default mongoose.models.Department || model("Department", departmentSchema);