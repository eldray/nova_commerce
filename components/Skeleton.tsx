import React from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--surface, #eee)",
        borderRadius: "var(--radius-sm, 0.375rem)",
        animation: "pulse 1.5s ease-in-out infinite",
        height: "1rem",
        width: "100%",
        ...style,
      }}
    />
  );
}
