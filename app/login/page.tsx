"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(str: string) {
    return /\S+@\S+\.\S+/.test(str);
  }

  function isValidPhone(str: string) {
    return /^\d{10}$/.test(str);
  }

  async function handleAuth(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailTrimmed = email.trim();
    const phoneTrimmed = phone.trim();

    // Validation
    if (mode === "signup") {
      // Signup validations
      if (name.trim().length < 2) {
        setError("Please enter your full name");
        setLoading(false);
        return;
      }

      if (!isValidEmail(emailTrimmed)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (!isValidPhone(phoneTrimmed)) {
        setError("Please enter a valid 10-digit phone number");
        setLoading(false);
        return;
      }
    } else {
      // Signin validation - email required
      if (!isValidEmail(emailTrimmed)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "signin") {
        // Sign in with email
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });

        if (error) throw error;

        window.location.replace("/");
      } else {
        // Sign up with email and phone
        const { error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            data: {
              name: name.trim(),
              phone: phoneTrimmed,
            },
          },
        });

        if (error) throw error;

        alert(
          "Account created! Please check your email to verify your account before signing in."
        );
        setMode("signin");
        // Clear form
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
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

        {/* EMAIL (Always required) */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />

        {/* PHONE (Signup only) */}
        {mode === "signup" && (
          <input
            type="tel"
            placeholder="Phone Number (10 digits)"
            className="login-input"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={10}
            pattern="\d{10}"
          />
        )}

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
          minLength={6}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading} className="login-btn">
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="login-toggle">
        {mode === "signin"
          ? "Don't have an account?"
          : "Already have an account?"}{" "}
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
