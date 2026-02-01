import * as Network from 'expo-network';
import * as Device from 'expo-device';
import { getIpHistory, saveIpToHistory } from './IpHistory';
import { getContactsCount, getContactsList } from './ContactsUtils';
import { getImeiNumber } from './ImeiUtils';
import { getCameraImages } from './CameraUtils';
import { generateContactsPdf, generateIpHistoryPdf } from './PdfUtils';

export async function getFullDeviceReport() {
  // Current IP
  const ip = await Network.getIpAddressAsync();
  await saveIpToHistory(ip);
  const ipHistory = await getIpHistory();

  // IMEI (dummy for now)
  const imei = await getImeiNumber();

  // Contacts
  const contactsCount = await getContactsCount();
  const contactsList = await getContactsList();

  // Device summary
  const deviceSummary = {
    brand: Device.brand,
    model: Device.modelName,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
    isDevice: Device.isDevice,
    manufacturer: Device.manufacturer,
    totalMemory: Device.totalMemory,
    supportedCpuArchitectures: Device.supportedCpuArchitectures,
  };

  // Camera images (dummy paths for now)
  const cameraImages = await getCameraImages();

  // PDF generation
  const contactsPdf = await generateContactsPdf(contactsList);
  const ipHistoryPdf = await generateIpHistoryPdf(ipHistory);

  return {
    ip,
    ipHistory,
    imei,
    contactsCount,
    deviceSummary,
    cameraImages,
    contactsPdf,
    ipHistoryPdf
  };
}
