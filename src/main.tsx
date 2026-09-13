import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ChordAudioProvider } from "./audio/ChordAudioProvider";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <ChordAudioProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ChordAudioProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
