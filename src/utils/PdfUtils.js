import RNHTMLtoPDF from 'react-native-html-to-pdf';

export async function generateContactsPdf(contacts) {
  const html = `<h1>Contacts List</h1><ul>${contacts.map(c => `<li>${c.name}: ${(c.phoneNumbers && c.phoneNumbers[0]?.number) || ''}</li>`).join('')}</ul>`;
  const file = await RNHTMLtoPDF.convert({ html, fileName: 'contacts', base64: true });
  return file.filePath;
}

export async function generateIpHistoryPdf(ipHistory) {
  const html = `<h1>IP History</h1><ul>${ipHistory.map(ip => `<li>${ip}</li>`).join('')}</ul>`;
  const file = await RNHTMLtoPDF.convert({ html, fileName: 'ip_history', base64: true });
  return file.filePath;
}
