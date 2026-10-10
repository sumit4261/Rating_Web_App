
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to load the store owner dashboard."
  );
}

function RatingStars({ rating }) {
  const value = Number(rating || 0);

  return (
    <span className="owner-stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(Math.max(0, Math.min(5, Math.round(value))))}
      {"☆".repeat(5 - Math.max(0, Math.min(5, Math.round(value))))}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

export default function StoreOwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({
    totalStores: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/owner/dashboard");
      const payload = response.data?.data ?? response.data;

      setStores(Array.isArray(payload.stores) ? payload.stores : []);
      setRatings(Array.isArray(payload.ratings) ? payload.ratings : []);
      setSummary({
        totalStores: Number(
          payload.summary?.totalStores ?? payload.stores?.length ?? 0
        ),
        totalRatings: Number(payload.summary?.totalRatings ?? 0),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <main className="owner-page">
        <p className="owner-message">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="owner-page">
      <header className="owner-heading">
        <div>
          <p className="owner-eyebrow">STORE MANAGEMENT</p>
          <h1>Store Owner Dashboard</h1>
          <p>Track your store performance and customer feedback.</p>
        </div>

        <button
          className="owner-refresh-button"
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="owner-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard(true)}>
            Try again
          </button>
        </div>
      )}

      <section className="owner-stats">
        <article className="owner-stat-card">
          <span>Your Stores</span>
          <strong>{summary.totalStores}</strong>
        </article>

        <article className="owner-stat-card">
          <span>Total Ratings</span>
          <strong>{summary.totalRatings}</strong>
        </article>

        <article className="owner-stat-card">
          <span>Overall Average</span>
          <strong>
            {(() => {
              const count = stores.reduce(
                (total, store) => total + Number(store.totalRatings || 0),
                0
              );
              const points = stores.reduce(
                (total, store) =>
                  total +
                  Number(store.averageRating || 0) *
                    Number(store.totalRatings || 0),
                0
              );

              return count ? (points / count).toFixed(2) : "—";
            })()}
            <small> / 5</small>
          </strong>
        </article>
      </section>

      <section className="owner-section">
        <div className="owner-section-title">
          <h2>Your Stores</h2>
          <span>{stores.length} store(s)</span>
        </div>

        {stores.length === 0 ? (
          <p className="owner-empty">
            No stores have been assigned to your account yet. Please contact
            your administrator.
          </p>
        ) : (
          <div className="owner-store-grid">
            {stores.map((store) => (
              <article className="owner-store-card" key={store.id}>
                <div className="owner-store-top">
                  <div>
                    <span className="owner-store-label">YOUR STORE</span>
                    <h3>{store.name}</h3>
                  </div>
                  <span className="owner-rating-number">
                    {store.averageRating ?? "—"} / 5
                  </span>
                </div>

                <p>{store.address}</p>
                <p>{store.email}</p>

                <div className="owner-store-rating">
                  <RatingStars rating={store.averageRating} />
                  <span>
                    {Number(store.totalRatings || 0)} rating(s)
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="owner-section">
        <div className="owner-section-title">
          <h2>Customer Ratings</h2>
          <span>{ratings.length} record(s)</span>
        </div>

        {ratings.length === 0 ? (
          <p className="owner-empty">
            No customers have rated your stores yet.
          </p>
        ) : (
          <div className="owner-table-wrapper">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Store</th>
                  <th>Rating</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((item) => (
                  <tr
                    key={`${item.storeId}-${item.userId}`}
                  >
                    <td>{item.userName}</td>
                    <td>{item.userEmail}</td>
                    <td>{item.storeName}</td>
                    <td>
                      <RatingStars rating={item.rating} />{" "}
                      <span>{item.rating}/5</span>
                    </td>
                    <td>{formatDate(item.updatedAt ?? item.ratedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
