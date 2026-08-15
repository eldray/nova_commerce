import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postRegisterWithPassword } from "../endpoints/auth/register_with_password_POST.schema";
import { useAuth } from "../helpers/useAuth";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function PasswordRegisterForm({ redirectTo = "/onboarding/business-info" }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await postRegisterWithPassword({ email, password, displayName });
      refetchSession();
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div style={{ color: "var(--error, #d32f2f)", fontSize: "0.875rem", padding: "0.5rem", borderRadius: "0.375rem", backgroundColor: "rgba(211,47,47,0.1)" }}>
          {error}
        </div>
      )}
      <div>
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.375rem" }}>
          Full name
        </label>
        <Input
          type="text"
          required
          placeholder="e.g. Ama Mensah"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.375rem" }}>
          Email address
        </label>
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.375rem" }}>
          Password
        </label>
        <Input
          type="password"
          required
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
        {loading ? <Spinner size="sm" /> : "Create account"}
      </Button>
    </form>
  );
}
