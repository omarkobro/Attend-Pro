import mongoose from "mongoose";

let db_connection = async() =>{
    await mongoose.connect(process.env.CONNECTION_URL_HOST ).then(()=>{
        console.log("Database connected successfully");
    }).catch((err)=>{
        console.log("Database Connection Failed", err);
    })
}

export default db_connection