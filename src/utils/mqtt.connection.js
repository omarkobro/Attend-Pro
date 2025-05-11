import mqtt from "mqtt";
import { handleCheckInRequest, handleCheckOutRequest } from "../modules/attendance/attendance.mqtt.controller.js";

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

mqttClient.on("error", (err) => {
  console.error("MQTT connection error:", err);
});


mqttClient.subscribe("attendance/check-in/request", { qos: 1 });
mqttClient.on("message", async (topic, message) => {
  if (topic === "attendance/check-in/request") {
    const payload = JSON.parse(message.toString());
    await handleCheckInRequest(payload); 
  }
});

mqttClient.subscribe("attendance/check-out/request", { qos: 1 });
mqttClient.on("message", async (topic, message) => {
  if (topic === "attendance/check-out/request") {
    const payload = JSON.parse(message.toString());
     handleCheckOutRequest(payload); 
  }
}); 




export default mqttClient;