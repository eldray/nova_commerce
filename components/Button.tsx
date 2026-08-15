import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", asChild = false, className = "", style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      fontWeight: 600,
      fontFamily: "inherit",
      borderRadius: "var(--radius, 0.625rem)",
      cursor: props.disabled ? "not-allowed" : "pointer",
      opacity: props.disabled ? 0.6 : 1,
      transition: "all 0.2s ease",
      border: "1px solid transparent",
      textDecoration: "none",
      ...(size === "sm" ? { padding: "0.375rem 0.75rem", fontSize: "0.875rem" } : {}),
      ...(size === "md" ? { padding: "0.625rem 1.25rem", fontSize: "0.95rem" } : {}),
      ...(size === "lg" ? { padding: "0.875rem 1.75rem", fontSize: "1.05rem" } : {}),
      ...(variant === "primary" ? { backgroundColor: "var(--primary, #000)", color: "var(--primary-foreground, #fff)" } : {}),
      ...(variant === "secondary" ? { backgroundColor: "var(--surface, #f0f0f0)", color: "var(--foreground, #111)", borderColor: "var(--border, #ccc)" } : {}),
      ...(variant === "outline" ? { backgroundColor: "transparent", color: "var(--foreground, #111)", borderColor: "var(--border, #ccc)" } : {}),
      ...(variant === "ghost" ? { backgroundColor: "transparent", color: "var(--foreground, #111)" } : {}),
      ...(variant === "danger" ? { backgroundColor: "var(--error, #d32f2f)", color: "#fff" } : {}),
      ...style,
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: `${className} ${child.props.className || ""}`.trim(),
        style: { ...baseStyle, ...child.props.style },
        ...props,
      });
    }

    return (
      <button ref={ref} className={className} style={baseStyle} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
