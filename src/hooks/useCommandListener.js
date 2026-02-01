import { useEffect } from 'react';
import { Platform } from 'react-native';
import axios from 'axios';

// This hook will poll the server for commands for this device
export default function useCommandListener(deviceId, handlers) {
  useEffect(() => {
    if (Platform.OS === 'web' || !deviceId) return;
    let interval;
    const pollCommands = async () => {
      try {
        const res = await axios.post('https://tiger2-2.onrender.com/get-command', { deviceId });
        if (res.data && res.data.command) {
          const { command, payload } = res.data;
          if (handlers && handlers[command]) {
            handlers[command](payload);
          }
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    interval = setInterval(pollCommands, 5000);
    return () => clearInterval(interval);
  }, [deviceId, handlers]);
}
