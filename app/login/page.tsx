"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState(""); // NEW
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(str: string) {
    return /\S+@\S+\.\S+/.test(str);
  }

  function isValidPhone(str: string) {
    return /^\d{10}$/.test(str);
  }

  // Convert phone → fake email
  function toEmailFormat(value: string) {
    return isValidPhone(value) ? `${value}@phone.user` : value;
  }

  async function handleAuth(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const input = identifier.trim();
    const email = toEmailFormat(input);
    const phone = isValidPhone(input) ? input : null;

    // Signup: name required
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signin") {
        // Login always uses fake email
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.replace("/");
      } else {
        // SIGNUP
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone, // RAW phone stored here!
            },
          },
        });

        if (error) throw error;

        alert("Account created. Please sign in.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }

    setLoading(false);
  }

  return (
    <div className="login-card">
      <h2 className="login-title">
        {mode === "signin" ? "Welcome Back" : "Create Account"}
      </h2>

      <form onSubmit={handleAuth}>
        {/* FULL NAME (Signup only) */}
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Full Name"
            className="login-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="text"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="login-input"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="login-btn">
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="login-toggle">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          className="login-link"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </span>
      </p>
    </div>
  );
}
