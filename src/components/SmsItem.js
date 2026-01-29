import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SmsItem = ({ sender, message, time }) => (
  <View style={styles.item}>
    <Text style={styles.sender}>{sender}</Text>
    <Text style={styles.message}>{message}</Text>
    <Text style={styles.time}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  item: { borderBottomWidth: 1, borderColor: '#eee', padding: 10 },
  sender: { fontWeight: 'bold', color: '#ff6600' },
  message: { marginVertical: 4 },
  time: { fontSize: 10, color: 'gray' }
});

export default SmsItem;