import "../index.css";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendCode } from "../utils/sendCode";
import { createSnippet, updateSnippet } from "../services/snippetService";
import { Save, Play, AlertCircle, CheckCircle, Clock, Cpu } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Code = ({
  prop,
  selectedLanguage,
  snippetId = null,
  initialCode = "",
  initialTitle = "",
}) => {
  const [message, setMessage] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [stats, setStats] = useState(null); // execution stats

  useEffect(() => {
    setMessage(initialCode);
    setTitle(initialTitle);
  }, [initialCode, initialTitle]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    // Clear previous results when code changes
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter some code");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Please select a language");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");
    setStats(null);

    try {
      const result = await sendCode(message, selectedLanguage);
      setOutput(result.output);
      setStats(result.stats);
      toast.success("Code executed successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Execution failed";
      setError(errorMsg);
      toast.error("Execution failed", {
        description: errorMsg.substring(0, 100),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!message.trim()) {
      toast.error("Please enter some code to save");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Please select a language");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your snippet");
      return;
    }

    setSaving(true);

    try {
      const snippetData = {
        title,
        code: message,
        language: selectedLanguage,
        output: output || null,
      };

      if (snippetId) {
        await updateSnippet(snippetId, snippetData);
        toast.success("Snippet updated successfully!");
      } else {
        await createSnippet(snippetData);
        toast.success("Snippet saved successfully!");
        setTitle("");
      }
    } catch (err) {
      console.error("Error saving snippet:", err);
      toast.error("Failed to save snippet", {
        description: err.response?.data?.error || err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const isError = !!error;
  const isSuccess = !error && output && !loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full gap-3">
      {/* Save snippet section */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Snippet title (required for saving)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveSnippet}
          disabled={
            saving || !message.trim() || !selectedLanguage || !title.trim()
          }
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : snippetId ? "Update" : "Save"}
        </Button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Input Side */}
        <div className="flex-1 flex flex-col">
          <h2 className="font-semibold mb-2">Code Editor</h2>
          <Textarea
            className="flex-1 resize-none font-mono text-sm"
            placeholder={prop}
            value={message}
            onChange={handleMessageChange}
            disabled={loading}
          />
        </div>

        {/* Output Side */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-2">
              Output
              {isError && <AlertCircle className="h-4 w-4 text-destructive" />}
              {isSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
            </h2>
            {stats && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.time || "N/A"}s
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  {stats.memory
                    ? `${Math.round(stats.memory / 1024)}MB`
                    : "N/A"}
                </span>
              </div>
            )}
          </div>
          <Textarea
            className={cn(
              "flex-1 resize-none font-mono text-sm",
              isError && "border-destructive text-destructive",
              isSuccess && "border-green-500",
            )}
            value={
              loading
                ? "Executing..."
                : error
                  ? ` Error:\n\n${error}`
                  : output || "Output will appear here..."
            }
            readOnly
            placeholder="Output will appear here..."
          />
        </div>
      </div>

      <Button type="submit" disabled={loading || !selectedLanguage}>
        <Play className="mr-2 h-4 w-4" />
        {loading ? "Executing..." : "Run Code"}
      </Button>
    </form>
  );
};
