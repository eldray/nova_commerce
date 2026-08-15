import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string | null;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div style={{ position: "relative", width: "100%" }}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={className}
      style={{
        width: "100%",
        padding: "0.625rem 0.875rem",
        fontSize: "0.95rem",
        borderRadius: "var(--radius, 0.625rem)",
        border: "1px solid var(--border, #ccc)",
        backgroundColor: "var(--card, #fff)",
        color: "var(--foreground, #111)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      {children}
      <span style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}>▼</span>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  return <span>{ctx?.selectedLabel || placeholder}</span>;
}

export function SelectContent({ children }: { children: ReactNode }) {
  const ctx = useContext(SelectContext);
  if (!ctx?.open) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: "0.25rem",
        backgroundColor: "var(--card, #fff)",
        border: "1px solid var(--border, #ccc)",
        borderRadius: "var(--radius, 0.625rem)",
        boxShadow: "var(--shadow-md)",
        zIndex: 100,
        maxHeight: "200px",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const ctx = useContext(SelectContext);
  const isSelected = ctx?.value === value;

  const handleClick = () => {
    ctx?.onValueChange?.(value);
    if (typeof children === "string") {
      ctx?.setSelectedLabel(children);
    } else {
      ctx?.setSelectedLabel(value);
    }
    ctx?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: "0.5rem 0.875rem",
        fontSize: "0.9rem",
        cursor: "pointer",
        backgroundColor: isSelected ? "var(--surface, #f0f0f0)" : "transparent",
        color: "var(--foreground, #111)",
      }}
    >
      {children}
    </div>
  );
}
