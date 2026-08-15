import React from "react";

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 14 : size === "md" ? 20 : 28;
  return (
    <span
      style={{
        display: "inline-block",
        width: px,
        height: px,
        border: "2px solid currentColor",
        borderRightColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
      }}
    />
  );
}
