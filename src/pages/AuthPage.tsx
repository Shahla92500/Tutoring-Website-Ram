import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { User } from "../types";

export default function AuthPage() {
  const { login, signup } = useAppContext();
  const navigate = useNavigate();
  const [loginFeedback, setLoginFeedback] = useState("");
  const [signupFeedback, setSignupFeedback] = useState("");

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = login(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
    setLoginFeedback(result.message);
    if (result.ok) {
      e.currentTarget.reset();
      navigate("/");
    }
  }

  function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = signup({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      role: String(fd.get("role") ?? "student") as User["role"]
    });

    setSignupFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  return (
    <section data-page="login" className="page">
      <h2>Login / Signup</h2>
      <div className="grid-2">
        <form id="login-form" className="card" onSubmit={handleLogin}>
          <h3>Login with Email</h3>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <button className="primary" type="submit">Login</button>
          <p className="muted auth-link-row"><Link to="/forgot-password">Forgot your password?</Link></p>
          <p className="feedback">{loginFeedback}</p>
        </form>

        <form id="signup-form" className="card" onSubmit={handleSignup}>
          <h3>Create Account</h3>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <label>Role
            <select name="role" required>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="primary" type="submit">Create Account</button>
          <p className="feedback">{signupFeedback}</p>
        </form>
      </div>

      <div className="card">
        <h3>Additional Auth (Planned)</h3>
        <p>Google login and forgot-password email flow are future integrations.</p>
      </div>
    </section>
  );
}
