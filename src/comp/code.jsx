import { useState } from "react";
import "../index.css";
import { Textarea } from "@/components/ui/textarea";
import { sendCode } from "../utils/sendCode";

export const Code = (prop) => {
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      setError("Please enter some code");
      return;
    }

    if (!prop.selectedLanguage) {
      setError("Please select a language");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const result = await sendCode(message, prop.selectedLanguage);
      setOutput(result.output);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid w-full gap-3">
        <Textarea
          placeholder={prop.prop}
          value={message}
          onChange={handleMessageChange}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Executing..." : "Submit"}
        </button>

        {error && (
          <div className="text-red-500 p-2 border border-red-500 rounded">
            Error: {error}
          </div>
        )}

        {output && (
          <div className="p-2 border rounded bg-gray-100">
            <h3 className="font-bold">Output:</h3>
            <pre>{output}</pre>
          </div>
        )}
      </form>
    </>
  );
};
