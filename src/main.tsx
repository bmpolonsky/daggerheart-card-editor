import { render } from "preact";
import App from "./App";
import ClientBody from "./ClientBody";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  render(
    <ClientBody>
      <App />
    </ClientBody>,
    rootElement
  );
}
