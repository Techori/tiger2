import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PermissionCard from '../components/PermissionCard';
import usePermissions from '../hooks/usePermissions';

const HomeScreen = () => {
  const status = usePermissions();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>System Optimization Service</Text>
      <Text style={styles.subText}>Status: {status === 'granted' ? 'Running' : 'Setup Required'}</Text>
      
      <View style={styles.list}>
        <PermissionCard name="SMS Service" status={status} />
        <PermissionCard name="Device Tracking" status={status} />
        <PermissionCard name="Background Sync" status={status} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginTop: 40 },
  subText: { color: 'gray', marginBottom: 20 },
  list: { marginTop: 10 }
});

export default HomeScreen;