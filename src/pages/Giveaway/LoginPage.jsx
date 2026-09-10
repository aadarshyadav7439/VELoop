import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { giveawayApi } from "../../services/giveawayApi";
import styles from "./Giveaway.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/giveaway";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await giveawayApi.login({ email: form.email, password: form.password });
      } else {
        await giveawayApi.register({ name: form.name, email: form.email, password: form.password });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => setForm({ name: "Demo Participant", email: "demo@veloop.test", password: "Password123!" });

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        <span className={styles.kicker}>VELOOP REWARDS</span>
        <h1>{mode === "login" ? "Login to participate" : "Create your account"}</h1>
        <p>Please login to your VELOOP Rewards account before participating in a giveaway.</p>

        <form onSubmit={submit} className={styles.authForm}>
          {mode === "register" && (
            <label>
              Full name
              <input value={form.name} onChange={update("name")} required autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={update("email")} required autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={update("password")} required minLength={6} autoComplete="current-password" />
          </label>

          {error && <div className={styles.formError}>{error}</div>}

          <button className={styles.cta} type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className={styles.authMeta}>
          <ShieldCheck size={14} />
          <span>Seeded demo account: demo@veloop.test / Password123! —</span>
          <button type="button" onClick={fillDemo}>fill it in</button>
        </div>

        <button type="button" className={styles.authSwitch} onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Create one" : "Already have an account? Login"}
        </button>

        <a className={styles.authBack} href="/giveaway">Back to Giveaway</a>
      </div>
    </main>
  );
}
