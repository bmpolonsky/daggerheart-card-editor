import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ClientBody from "./ClientBody";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ClientBody>
      <App />
    </ClientBody>
  </React.StrictMode>
);
