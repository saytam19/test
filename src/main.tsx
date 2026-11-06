import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Hero from "./components/Hero";
import "./index.css";

createRoot(document.getElementById("hero-root")!).render(
  <StrictMode>
    <Hero />
  </StrictMode>,
);
