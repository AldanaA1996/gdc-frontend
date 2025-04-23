const API_URL = import.meta.env.VITE_API_URL || "http://localhost:1337";

export async function fetchFromAPI(endpoint: string, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // si usás auth
    ...options,
  });

  if (!res.ok) {
    throw new Error("Error fetching data");
  }

  return res.json();
}
