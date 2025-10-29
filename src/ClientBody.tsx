import { useEffect, type ReactNode } from "react";

export default function ClientBody({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return <div className="antialiased">{children}</div>;
}
