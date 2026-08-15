import React from "react";
import { Spinner } from "./Spinner";

export function AuthLoadingState({ title = "Loading..." }: { title?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
      <Spinner size="lg" />
      <p style={{ color: "var(--muted-foreground, #666)", fontSize: "0.95rem" }}>{title}</p>
    </div>
  );
}
