export const formatSmsData = (address, body, date) => {
  return {
    sender: address,
    message: body,
    timestamp: new Date(date).toLocaleString(),
    receivedAt: new Date().toISOString(),
  };
};

export const truncateMessage = (text, limit = 50) => {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "...";
};