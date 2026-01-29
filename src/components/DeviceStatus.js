import React from 'react';
import { View, Text } from 'react-native';

const DeviceStatus = ({ model, brand, version }) => (
  <View style={{ padding: 20, backgroundColor: '#333', borderRadius: 10 }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Target: {brand} {model}</Text>
    <Text style={{ color: '#aaa' }}>Android Version: {version}</Text>
  </View>
);

export default DeviceStatus;