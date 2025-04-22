import mqtt from "mqtt";
import { handleCheckInRequest, handleCheckOutRequest } from "../modules/attendance/attendance.mqtt.controller.js";

// Use localhost for local broker; replace with IP for remote brokers
const options = {
    host: process.env.BROKER_URl,
    port: process.env.BROKER_PORT, 
    protocol: 'mqtts',
    username: process.env.HIVE_USER_NAME,
    password: process.env.HIVE_PASSWORD
  };
  
  const mqttClient = mqtt.connect(options);

mqttClient.on("connect", () => {
  console.log("MQTT connected to broker");
});

// mqttClient.on("error", (err) => {
//   console.error("MQTT connection error:", err);
// });


mqttClient.subscribe("attendance/check-in/request", { qos: 1 });
mqttClient.on("message", async (topic, message) => {
  if (topic === "attendance/check-in/request") {
    const payload = JSON.parse(message.toString());
    await handleCheckInRequest(payload); // Step 2
  }
});

mqttClient.subscribe("attendance/check-out/request", { qos: 1 });
mqttClient.on("message", async (topic, message) => {
  if (topic === "attendance/check-out/request") {
    const payload = JSON.parse(message.toString());
     handleCheckOutRequest(payload); // Step 2
  }
}); 


// mqttClient.on("connect", () => {
//   console.log("MQTT connected to broker ✅");

//   // 🔹 Temporary test payload for handleCheckInRequest
//   const testPayload = {
//     student_id: "42021146", // 🧪 Replace with valid student_id
//     // rfid_tag: "AA:BB:CC:DD", // 🧪 Optional: must match the student's tag if provided
//     device_id: "1", // 🧪 Must exist in DB and be in 'reserved' + 'check-in' mode
//     marked_by: "face_recognition" // Can be "face", "rfid", etc.
//   };

//   mqttClient.publish(
//     "attendance/check-in/request",
//     JSON.stringify(testPayload),
//     { qos: 1 },
//     (err) => {
//       if (err) {
//         console.error("❌ Failed to publish test check-in:", err);
//       } else {
//         console.log("📨 Test check-in request sent");
//       }
//     }
//   );
// });

export default mqttClient;