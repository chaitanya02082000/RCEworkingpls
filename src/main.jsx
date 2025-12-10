import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Providers } from "./comp/provides.jsx";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Providers>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </Providers>
    </BrowserRouter>
  </ErrorBoundary>,
);
