import React, { createContext, useContext, useState, ReactNode } from "react";
import { z } from "zod";

interface UseFormOptions<T extends Record<string, any>> {
  schema?: z.ZodType<T>;
  defaultValues: T;
}

export function useForm<T extends Record<string, any>>({ schema, defaultValues }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (onValid: (data: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    if (schema) {
      const result = schema.safeParse(values);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[String(issue.path[0])] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }
    setErrors({});
    onValid(values);
  };

  return {
    values,
    setValues,
    errors,
    setErrors,
    handleSubmit,
  };
}

const FormContext = createContext<any>(null);
const FormItemContext = createContext<{ name?: string } | null>(null);

export function Form({ children, ...props }: any) {
  return <FormContext.Provider value={props}>{children}</FormContext.Provider>;
}

export function FormItem({ name, children, className = "" }: { name?: string; children: ReactNode; className?: string }) {
  return (
    <FormItemContext.Provider value={{ name }}>
      <div className={className} style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

export function FormLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <label className={className} style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground, #111)" }}>
      {children}
    </label>
  );
}

export function FormControl({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function FormDescription({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground, #666)", margin: 0 }}>{children}</p>;
}

export function FormMessage() {
  const formItemCtx = useContext(FormItemContext);
  const formCtx = useContext(FormContext);
  const error = formItemCtx?.name ? formCtx?.errors?.[formItemCtx.name] : null;

  if (!error) return null;
  return <span style={{ fontSize: "0.8rem", color: "var(--error, #d32f2f)", fontWeight: 500 }}>{error}</span>;
}
