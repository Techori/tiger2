import * as Device from 'expo-device';

export const getDeviceProfile = () => {
  return {
    brand: Device.brand,
    model: Device.modelName,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
    isDevice: Device.isDevice,
  };
};

export const formatDeviceLabel = () => {
  return `${Device.brand} ${Device.modelName} (Android ${Device.osVersion})`;
};