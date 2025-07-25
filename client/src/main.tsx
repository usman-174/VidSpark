import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryProvider } from "./providers/QueryProvider";



createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      
    </QueryProvider>
  </StrictMode>
);
