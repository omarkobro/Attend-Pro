
// Here we're optimizing the index.js file by moving all the lines we can from the index an adding it to one function which will be invoked in the index.js file
// instead of loading express twice we will pass express as a parameter here
// notice that we here add every thing other than routers since they will be added in a dedicated file 
import db_connection from "../DB/DB_connection.js";
import { globalResponse } from "./middlewares/globalResponse.js";
import * as routers from "./modules/index.routers.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeSocket, server } from "./utils/socket.js";
import axios from "axios";
import cron from "node-cron";

export let initiateApp = (app ,express)=>{
    let port = process.env.PORT
    app.use(express.json())

    // Security Headers Middleware
    app.use((req, res, next) => {
    // Content Security Policy (CSP)
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; script-src 'none'; object-src 'none';"
    );
    // X-XSS-Protection (for older browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
    });

    // CORS configuration
    app.use(cors());
    app.use(cookieParser());

      // Ping route to confirm the server is running
      app.get("/ping", (req, res) => {
      res.send("Server is alive!");
      });
      
    app.use("/auth", routers.authRouter)
    app.use("/allowedStaff", routers.allowedStaffRouter)
    app.use("/subjects", routers.subjectRouter)
    app.use("/groups", routers.groupRouter)
    app.use("/department", routers.departmentRouter)
    app.use("/schedules", routers.schedulesRouter)
    app.use("/devices", routers.deviceRouter)
    app.use("/attendance", routers.attendanceRouter)
    app.use("/students", routers.studentsRouter)
    app.use("/warnings", routers.warningsRouter)
    app.use('*', (req,res,next)=>{
        res.status(404).json({message: 'Not found'})
    })
    app.use(globalResponse)
    db_connection()
    initializeSocket(app);  

    // Schedule a ping request to prevent sleep mode
cron.schedule("*/10 * * * *", async () => {
  try {
    const serverUrl = "https://attend-pro.onrender.com/ping";
    const response = await axios.get(serverUrl);
    console.log(`Pinged server: ${response.statusText}`);
  } catch (error) {
    console.error("Error pinging server:", error.message);
  }
});

    server.listen(port, ()=>{console.log("app is running successfully on port 3000");})
}