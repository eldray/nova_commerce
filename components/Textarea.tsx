import React, { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", style, ...props }, ref) => {
    const defaultStyle: React.CSSProperties = {
      width: "100%",
      padding: "0.625rem 0.875rem",
      fontSize: "0.95rem",
      fontFamily: "inherit",
      borderRadius: "var(--radius, 0.625rem)",
      border: "1px solid var(--border, #ccc)",
      backgroundColor: "var(--card, #fff)",
      color: "var(--foreground, #111)",
      outline: "none",
      minHeight: "80px",
      resize: "vertical",
      boxSizing: "border-box",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      ...style,
    };

    return <textarea ref={ref} className={className} style={defaultStyle} {...props} />;
  }
);
Textarea.displayName = "Textarea";
