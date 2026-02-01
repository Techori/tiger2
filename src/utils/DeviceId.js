import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export async function getOrCreateDeviceId() {
  let id = await AsyncStorage.getItem('tiger_device_id');
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem('tiger_device_id', id);
  }
  return id;
}
