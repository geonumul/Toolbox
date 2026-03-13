
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { LangProvider } from "./contexts/LangContext.tsx";

  createRoot(document.getElementById("root")!).render(
    <LangProvider>
      <App />
    </LangProvider>
  );
  