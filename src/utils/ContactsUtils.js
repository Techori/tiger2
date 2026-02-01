import * as Contacts from 'expo-contacts';

export async function getContactsCount() {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return 0;
  const { data } = await Contacts.getContactsAsync();
  return data.length;
}

export async function getContactsList() {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return [];
  const { data } = await Contacts.getContactsAsync({ fields: ['phoneNumbers'] });
  return data;
}
