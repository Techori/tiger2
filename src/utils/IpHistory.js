import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'tiger_ip_history';
const MAX_HISTORY = 5;

export async function saveIpToHistory(ip) {
  let history = await getIpHistory();
  if (!history.includes(ip)) {
    history.unshift(ip);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

export async function getIpHistory() {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}
