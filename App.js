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
      
      {Platform.OS === 'web' ? (
        <WebDashboard /> 
      ) : (
        <HomeScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
