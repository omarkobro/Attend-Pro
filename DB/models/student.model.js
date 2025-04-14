import mongoose, { model, Schema } from "mongoose";


const studentSchema = new Schema({
    user_id : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
        unique : true 
    },
    student_name: {
        type : String,
        required : true,
        trim: true, 
        minlength:2,
        maxlength:20,
    },
    student_id : {
        type : String ,
        unique : true ,
        sparse : true
    },
    rfid_tag: {
        type: String,
        unique : true,
        sparse : true
     },

    department: {
        type: Schema.Types.ObjectId,
        ref: "Department",
    },
    year : {
        type : Number ,
    },
    // subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }]
},{timestamps:true})

export default mongoose.models.Student || model('Student', studentSchema)
