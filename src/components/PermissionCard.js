import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PermissionCard = ({ name, status }) => (
  <View style={styles.card}>
    <Text style={styles.name}>{name}</Text>
    <Text style={[styles.status, { color: status === 'granted' ? 'green' : 'red' }]}>
      {status === 'granted' ? '● Active' : '○ Pending'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: { padding: 15, marginVertical: 5, backgroundColor: '#f9f9f9', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold' },
  status: { fontSize: 14 }
});

export default PermissionCard;