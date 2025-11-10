import { useState } from "react";
import { Code } from "./comp/code";
import { Combobox } from "./comp/dropdown";

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState("");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Code Executor</h1>

      <div className="mb-4">
        <Combobox value={selectedLanguage} onChange={setSelectedLanguage} />
      </div>

      <Code
        prop="Enter your code here..."
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}

export default App;
