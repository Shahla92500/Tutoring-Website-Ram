import { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../clients/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setMsg("");
      setLoading(true);

      const res = await apiClient.post("/users/forgot-password", { email });
      setMsg(res.data?.message || "If an account exists, a reset link will be sent.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-single-wrap">
      <div className="card auth-single-card">
        <h2>Reset Password</h2>
        <p className="muted">Enter your email and we will send you a reset link.</p>

        {msg ? <p className="feedback ok">{msg}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              autoFocus
            />
          </label>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="muted auth-link-row">
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}
