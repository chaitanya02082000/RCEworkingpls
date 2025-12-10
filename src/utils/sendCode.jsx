import axios from "axios";

// ✅ Use relative URL - Netlify will proxy to Render
const API_URL = import.meta.env.VITE_API_URL || "";

export const sendCode = async (code, language) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/execute`,
      {
        code: code,
        language: language.toLowerCase(),
      },
      {
        withCredentials: true,
      },
    );

    console.log("Execution output:", response.data.output);
    return response.data;
  } catch (error) {
    console.error(
      "Error executing code:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
