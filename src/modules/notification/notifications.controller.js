import Notification from "../../../DB/models/notification.model.js";
import { AppError } from "../../utils/appError.js";



//============= get Notifications For User =======================
  export const getUserNotifications = async (req, res) => {
    const userId = req.authUser._id;
    const { type } = req.query;
  
    const filter = { recipient: userId };
    if (type) filter.type = type;
  
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }) 
      .lean();
  
    res.status(200).json({ notifications });
  };


//============= get Notifications count =======================
export const getUnreadNotificationCount = async (req, res) => {
    const userId = req.authUser._id;
  
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      is_read: false,
    });
  
    res.status(200).json({ unreadCount });
  };


//============= mark Notificatio As Read API =======================  
// export const markNotificationAsRead = async (req, res) => {
//     const { notificationId } = req.params;
  
//     const notification = await Notification.findOneAndUpdate(
//       { _id: notificationId, recipient: req.authUser._id },
//       { is_read: true },
//       { new: true }
//     );
  
//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found or unauthorized" });
//     }
  
//     res.json({ message: "Notification marked as read successfully" });
//   };


//============= mark all Notification As Read API =======================  
  export const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.authUser._id;
  
    const result = await Notification.updateMany(
      { recipient: userId, is_read: false },
      { $set: { is_read: true } }
    );
  
    res.status(200).json({
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  };