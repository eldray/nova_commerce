import React from "react";
import { Link } from "react-router-dom";

export function AuthErrorPage({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center", padding: "2rem" }}>
      {icon}
      <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 700 }}>{title}</h1>
      <p style={{ marginTop: "0.5rem", color: "var(--muted-foreground, #666)", maxWidth: "400px" }}>{message}</p>
      <Link to="/" style={{ marginTop: "1.5rem", color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>
        Return to Home
      </Link>
    </div>
  );
}
