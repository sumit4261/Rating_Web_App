
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

function Stars({ value, interactive = false, onSelect }) {
  return (
    <div className={`stars ${interactive ? "interactive-stars" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (value || 0) ? "selected" : ""}`}
          disabled={!interactive}
          onClick={() => onSelect?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          title={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StoreCard({ store, onRated }) {
  const [selectedRating, setSelectedRating] = useState(
    store.userRating ?? 0
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submitRating() {
    if (!selectedRating) {
      setError("Please select a star rating first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.post(`/ratings/${store.id}`, {
        rating: selectedRating,
      });

      setMessage("Rating saved successfully!");
      await onRated();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save your rating."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="store-card">
      <div className="store-card-top">
        <div className="store-icon" aria-hidden="true">🏬</div>
        <span className="rating-count">
          {store.totalRatings} rating{store.totalRatings !== 1 ? "s" : ""}
        </span>
      </div>

      <h2>{store.name}</h2>
      <p className="store-address">{store.address}</p>

      <div className="average-rating">
        <span className="average-number">
          {store.averageRating == null
            ? "—"
            : Number(store.averageRating).toFixed(1)}
        </span>

        <Stars value={store.averageRating || 0} />
        <span className="rating-label">Overall rating</span>
      </div>

      <div className="your-rating">
        <p className="your-rating-label">Your rating</p>

        <Stars
          value={selectedRating}
          interactive
          onSelect={(rating) => {
            setSelectedRating(rating);
            setError("");
            setMessage("");
          }}
        />

        <button
          type="button"
          className="rate-button"
          onClick={submitRating}
          disabled={saving || selectedRating === 0}
        >
          {saving
            ? "Saving..."
            : store.userRating == null
              ? "Submit Rating"
              : "Update Rating"}
        </button>

        {error && <p className="error store-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
      </div>
    </article>
  );
}

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/stores", {
        params: {
          name: name.trim(),
          address: address.trim(),
        },
      });

      setStores(response.data.stores || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load stores."
      );
    } finally {
      setLoading(false);
    }
  }, [name, address]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  return (
    <main className="stores-page">
      <section className="stores-heading">
        <p className="eyebrow">DISCOVER • RATE • REVIEW</p>
        <h1>Find your next favorite store.</h1>
        <p>
          Explore stores, check community ratings, and share your experience.
        </p>
      </section>

      <section className="search-panel">
        <div className="search-field">
          <label htmlFor="search-name">Store name</label>
          <input
            id="search-name"
            placeholder="Search by store name..."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-address">Address</label>
          <input
            id="search-address"
            placeholder="Search by location..."
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <button type="button" onClick={loadStores}>
          Search Stores
        </button>
      </section>

      <div className="results-heading">
        <h2>Explore stores</h2>
        {!loading && <span>{stores.length} found</span>}
      </div>

      {loading && <p className="page-message">Loading stores...</p>}

      {!loading && error && (
        <div className="page-error">
          <p>{error}</p>
          <button type="button" onClick={loadStores}>Try Again</button>
        </div>
      )}

      {!loading && !error && stores.length === 0 && (
        <div className="empty-state">
          <span>🔎</span>
          <h3>No stores found</h3>
          <p>Try changing your search terms.</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <section className="store-grid">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onRated={loadStores}
            />
          ))}
        </section>
      )}
    </main>
  );
}
