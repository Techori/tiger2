const API_URL = 'https://tiger-bridge.onrender.com';

export const sendDataToServer = async (endpoint, payload) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Server Error:", error);
    return null;
  }
};
