import React, { ReactNode } from "react";

export function Badge({
  children,
  variant = "secondary",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "destructive";
  className?: string;
}) {
  const styles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.2rem 0.55rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    ...(variant === "primary" ? { backgroundColor: "var(--primary)", color: "#fff" } : {}),
    ...(variant === "secondary" ? { backgroundColor: "var(--surface)", color: "var(--foreground)" } : {}),
    ...(variant === "success" ? { backgroundColor: "var(--success)", color: "#fff" } : {}),
    ...(variant === "warning" ? { backgroundColor: "var(--warning)", color: "#111" } : {}),
    ...(variant === "error" || variant === "destructive" ? { backgroundColor: "var(--error, #d32f2f)", color: "#fff" } : {}),
    ...(variant === "outline" ? { backgroundColor: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" } : {}),
  };

  return <span className={className} style={styles}>{children}</span>;
}
