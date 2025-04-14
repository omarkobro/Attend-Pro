import mongoose, { model, Schema } from "mongoose";

const announcementSchema = new Schema({
    title :{
        type : String,
        trim : true ,
        required : true
    },
    content : {
        type : String ,
        required : true,
    },
    createdBy : {
        type : Schema.Types.ObjectId,
        ref : "Staff",
        required : true,
    }
},{timestamps:true})

export default mongoose.models.Announcement || model('Announcement', announcementSchema)
