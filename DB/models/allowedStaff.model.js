import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from "../../src/utils/systemRoles.js";

const allowedStaffSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
    role: {
        type: String,
        enum: Object.values(systemRoles), 
        default: systemRoles.STAFF
    },
    position : {
        type: String, 
        enum: ['Assistant-lecturer', 'Lecturer'], 
        default: 'Lecturer' 
    },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    
},{timestamps:true})

export default mongoose.models.allowedStaff || model('allowedStaff', allowedStaffSchema)
