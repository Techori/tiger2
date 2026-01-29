// Last mein '/' lagana zaruri hai
const API_URL = 'https://tiger2.onrender.com/'; 

export const sendDataToServer = async (endpoint, payload) => {
  try {
    // Agar endpoint '/log-sms' hai, toh ye 'https://tiger-bridge.onrender.com/log-sms' banayega
    const targetUrl = `${API_URL}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString() // Server ko pata chale message kab ka hai
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Tiger Bridge Error:", error.message);
    return null;
  }
};
