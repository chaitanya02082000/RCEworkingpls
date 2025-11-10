import axios from "axios";

export const sendCode = async (code, language) => {
  try {
    const response = await axios.post("http://localhost:3000/api/execute", {
      code: code,
      language: language.toLowerCase(), // Backend expects lowercase
    });

    console.log("Execution output:", response.data.output);
    return response.data; // Returns { output: "..." }
  } catch (error) {
    console.error(
      "Error executing code:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
