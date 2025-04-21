import mongoose, { model, Schema } from "mongoose";

const staffSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    staff_name: {
        type: String,
        required: true,
        trim: true, 
        minlength: 2,
        maxlength: 20,
    },
    staff_number: { // works as an ID for staff
        type: String,
        unique: true
    },

    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },

    position: {
        type: String, 
        enum: ['Assistant-lecturer', 'Lecturer'], 
        default: 'Lecturer' 
    },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }], 
    join_date: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

export default mongoose.models.Staff || model('Staff', staffSchema);
