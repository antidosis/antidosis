import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initGlobalErrorHandlers } from "@mobile/lib/crash-reporter";
import "./index.css";

initGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
