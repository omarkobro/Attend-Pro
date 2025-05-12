import mongoose, { model, Schema } from "mongoose";

let deviceSchema = new Schema({
    device_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['free', 'reserved'],
        required: true,
        default: 'free'
    },
    currentSubjectId: {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
        default: null
    },
    currentGroupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    sessionMode: {
        type: String,
        enum: ['check-in', 'check-out', null], 
        default: null
    },
    // weekNumber: {
    //     type: Number,
    //     default: null,
    //     required: true,
    // },
    sessionType: {
        type: String,
        enum: ["lecture", "lab"],
        default: null,
    },
}, { timestamps: true });

export default mongoose.models.Device || model('Device', deviceSchema);