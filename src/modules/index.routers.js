// here is dedicated file for the routers 
import authRouter from "./authentication/auth.router.js"
import allowedStaffRouter from "./allowedStaff/allowedStaff.router.js"
import subjectRouter from "./subject/subject.router.js"
import groupRouter from "./group/groups.router.js"
import departmentRouter from "./department/department.router.js"
import schedulesRouter from "./schedule/schedule.router.js"
import deviceRouter from "./device/device.router.js"
import attendanceRouter from "./attendance/attendance.router.js"
import studentsRouter from "./student/students.router.js"
import warningsRouter from "./warnings/warning.router.js"
import notificationsRouter from "./notification/notifications.router.js"
import staffRouter from "./staff/staff.router.js"
import announcementRouter from "./announcement/announcement.router.js"
import userRouter from "./user/user.router.js"
import semesterRouter from "./semster/semester.router.js"

export{authRouter, allowedStaffRouter,subjectRouter,groupRouter,departmentRouter,schedulesRouter,deviceRouter,attendanceRouter,studentsRouter,warningsRouter,notificationsRouter,staffRouter,announcementRouter, userRouter,semesterRouter}