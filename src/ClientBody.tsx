import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

export default function ClientBody({ children }: { children: ComponentChildren }) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return <div className="antialiased">{children}</div>;
}
