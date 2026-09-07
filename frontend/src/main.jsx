import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Every number input in the app defaults to 0 (e.g. "Amount" pre-filled from
// a balance, charge fields defaulting to 0). Without this, clicking into a
// number field places the cursor after the existing "0" instead of selecting
// it, so typing "1000" produces "01000" -- this fixes that globally, for
// every current and future <input type="number"> in the app, in one place.
document.addEventListener("focusin", (e) => {
  if (e.target.tagName === "INPUT" && e.target.type === "number") {
    e.target.select();
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
