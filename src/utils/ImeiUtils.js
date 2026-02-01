import { Platform } from 'react-native';
// NOTE: IMEI access is restricted on Android 10+ and not available on iOS. This is a placeholder.
export async function getImeiNumber() {
  if (Platform.OS === 'android') {
    try {
      const IMEI = require('react-native-imei').default;
      return await IMEI.getImei();
    } catch (e) {
      return 'Not available';
    }
  }
  return 'Not available';
}
