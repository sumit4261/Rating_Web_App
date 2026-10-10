
import { useState } from "react";
import api from "../api/axios";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.put("/password", form);
      setMessage(response.data.message || "Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="owner-page">
      <section className="owner-section" style={{ maxWidth: 480, margin: "30px auto" }}>
        <h2>Change Password</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
            />
          </label>

          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={16}
              required
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
            />
            <small>8–16 characters, including an uppercase letter and special character.</small>
          </label>

          {error && <p className="modal-error">{error}</p>}
          {message && <p className="modal-success">{message}</p>}

          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
