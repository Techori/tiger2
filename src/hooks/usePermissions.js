import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

const usePermissions = () => {
  const [status, setStatus] = useState('pending');

  const requestAll = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, // Mic Access
          PermissionsAndroid.PERMISSIONS.CAMERA,        // Camera Access
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);

        const allGranted = Object.values(granted).every(
          (res) => res === PermissionsAndroid.RESULTS.GRANTED
        );

        setStatus(allGranted ? 'granted' : 'denied');
      } catch (err) {
        console.warn(err);
        setStatus('error');
      }
    } else {
      setStatus('web_active');
    }
  };

  useEffect(() => {
    requestAll();
  }, []);

  return status;
};

export default usePermissions;