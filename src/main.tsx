import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { store } from "./app/store.ts";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  // Если элемента нет, выбрасываем ошибку, чтобы разработчик сразу это увидел
  throw new Error("Failed to find the root element. Check your index.html");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
