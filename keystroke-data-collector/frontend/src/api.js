const API_BASE_URL = "https://keystroke-dynamics-production.up.railway.app/api";

export const getPrediction = async (data) => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return response.json();
};
