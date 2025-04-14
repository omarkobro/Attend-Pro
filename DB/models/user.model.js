import mongoose, { model, Schema } from "mongoose";


const userSchema = new Schema({
    firstName: {
        type : String,
        required : true,
        trim: true, 
        minlength:2,
        maxlength:20,
    },
    lastName: {
        type : String,
        required : true,
        trim: true, 
        minlength:2,
        maxlength:20,
    },
    email : {
        type : String,
        required : true ,
        unique: true,
        trim : true 
    },
    university_email: {
        type: String,
        unique: true,
        sparse: true,
        trim : true,
        match: /^[a-zA-Z0-9._%+-]+@hti\.edu\.eg$/,
    },
    password : {
        type : String ,
        required : true ,
        minlength:8
    },
    role : {
        type : String ,
        enum : ['student' , 'staff', 'admin'],
        default: 'student',
        required: true
    },
    phoneNumber : {
        type:String,
        required : true
    },
    pfp : {
        secure_url : {
            type : String,
            default : null
          },
          public_id:{
            type: String,
            default : null
          }
    },
    isVerified :{
        type : Boolean,
        default : false
    },
    OTP:{
        type:String,
        default:''
    },
    expiresIn:{
        type: Date,
        default : 0
    },
    refresh_tokens: [{ type: String }],  
    token_blacklist: [{ type: String }], 
},{timestamps:true})

export default mongoose.models.User || model('User', userSchema)
