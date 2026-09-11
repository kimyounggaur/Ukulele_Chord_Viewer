import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ChordAudioProvider } from "./audio/ChordAudioProvider";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChordAudioProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ChordAudioProvider>
  </React.StrictMode>,
);
