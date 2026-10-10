
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const EMPTY_STATS = {
  totalUsers: 0,
  totalStores: 0,
  totalRatings: 0,
};

const EMPTY_USER = {
  name: "",
  email: "",
  password: "",
  address: "",
  role: "USER",
};

const EMPTY_STORE = {
  name: "",
  email: "",
  address: "",
  ownerUserId: "",
};

function getPayload(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getList(response, key) {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload[key])) return payload[key];
  if (Array.isArray(payload.data?.[key])) return payload.data[key];

  return [];
}

function getStats(response) {
  const payload = getPayload(response);
  const stats = payload.stats ?? payload;

  return {
    totalUsers: Number(stats.totalUsers ?? stats.total_users ?? 0),
    totalStores: Number(stats.totalStores ?? stats.total_stores ?? 0),
    totalRatings: Number(stats.totalRatings ?? stats.total_ratings ?? 0),
  };
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function formatRating(value) {
  if (value === null || value === undefined || value === "") {
    return "No ratings";
  }

  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(2) : "No ratings";
}

function validatePassword(password) {
  return (
    password.length >= 8 &&
    password.length <= 16 &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="create-user-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [error, setError] = useState("");

  const [userFilters, setUserFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: "",
    sortBy: "name",
    order: "asc",
  });

  const [storeFilters, setStoreFilters] = useState({
    name: "",
    email: "",
    address: "",
    sortBy: "name",
    order: "asc",
  });

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createUserSuccess, setCreateUserSuccess] = useState("");
  const [newUser, setNewUser] = useState(EMPTY_USER);

  const [showCreateStore, setShowCreateStore] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [createStoreError, setCreateStoreError] = useState("");
  const [createStoreSuccess, setCreateStoreSuccess] = useState("");
  const [newStore, setNewStore] = useState(EMPTY_STORE);

  const storeOwners = useMemo(
    () => users.filter((user) => user.role === "STORE_OWNER"),
    [users]
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/dashboard");
      setStats(getStats(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const params = {
        ...userFilters,
        name: userFilters.name.trim(),
        email: userFilters.email.trim(),
        address: userFilters.address.trim(),
      };

      const response = await api.get("/admin/users", { params });
      setUsers(getList(response, "users"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters]);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);

    try {
      const params = {
        ...storeFilters,
        name: storeFilters.name.trim(),
        email: storeFilters.email.trim(),
        address: storeFilters.address.trim(),
      };

      const response = await api.get("/admin/stores", { params });
      setStores(getList(response, "stores"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStoresLoading(false);
    }
  }, [storeFilters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  function updateUserFilter(event) {
    const { name, value } = event.target;

    setUserFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updateStoreFilter(event) {
    const { name, value } = event.target;

    setStoreFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function closeUserModal() {
    if (creatingUser) return;

    setShowCreateUser(false);
    setCreateUserError("");
    setCreateUserSuccess("");
    setNewUser(EMPTY_USER);
  }

  function closeStoreModal() {
    if (creatingStore) return;

    setShowCreateStore(false);
    setCreateStoreError("");
    setCreateStoreSuccess("");
    setNewStore(EMPTY_STORE);
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setCreateUserError("");
    setCreateUserSuccess("");

    const name = newUser.name.trim();
    const email = newUser.email.trim();
    const address = newUser.address.trim();

    if (name.length < 20 || name.length > 60) {
      setCreateUserError("Name must contain 20–60 characters.");
      return;
    }

    if (address.length > 400) {
      setCreateUserError("Address cannot exceed 400 characters.");
      return;
    }

    if (!validatePassword(newUser.password)) {
      setCreateUserError(
        "Password must be 8–16 characters and include an uppercase letter and a special character."
      );
      return;
    }

    if (!["USER", "STORE_OWNER", "ADMIN"].includes(newUser.role)) {
      setCreateUserError("Please select a valid role.");
      return;
    }

    setCreatingUser(true);

    try {
      await api.post("/admin/users", {
        name,
        email,
        password: newUser.password,
        address,
        role: newUser.role,
      });

      setCreateUserSuccess(
        `${newUser.role === "STORE_OWNER" ? "Store owner" : newUser.role === "ADMIN" ? "Administrator" : "User"} created successfully.`
      );

      setNewUser(EMPTY_USER);

      await Promise.all([loadDashboard(), loadUsers()]);

      // Briefly display success, then close the popup.
      window.setTimeout(() => {
        setShowCreateUser(false);
        setCreateUserSuccess("");
      }, 800);
    } catch (err) {
      setCreateUserError(getErrorMessage(err));
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleCreateStore(event) {
    event.preventDefault();
    setCreateStoreError("");
    setCreateStoreSuccess("");

    const name = newStore.name.trim();
    const email = newStore.email.trim();
    const address = newStore.address.trim();
    const ownerUserId = Number(newStore.ownerUserId);

    if (name.length < 20 || name.length > 60) {
      setCreateStoreError("Store name must contain 20–60 characters.");
      return;
    }

    if (address.length > 400) {
      setCreateStoreError("Address cannot exceed 400 characters.");
      return;
    }

    if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
      setCreateStoreError("Please select a store owner.");
      return;
    }

    setCreatingStore(true);

    try {
      await api.post("/admin/stores", {
        name,
        email,
        address,
        ownerUserId,
      });

      setCreateStoreSuccess("Store created successfully.");
      setNewStore(EMPTY_STORE);

      await Promise.all([loadDashboard(), loadStores()]);

      window.setTimeout(() => {
        setShowCreateStore(false);
        setCreateStoreSuccess("");
      }, 800);
    } catch (err) {
      setCreateStoreError(getErrorMessage(err));
    } finally {
      setCreatingStore(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h1>Admin Dashboard</h1>
          <p>Manage users, store owners, stores, and ratings.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setCreateUserError("");
            setCreateUserSuccess("");
            setShowCreateUser(true);
          }}
        >
          + Create User
        </button>
      </header>

      {error && (
        <div className="page-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Users</span>
          <strong>{stats.totalUsers}</strong>
        </article>
        <article className="stat-card">
          <span>Total Stores</span>
          <strong>{stats.totalStores}</strong>
        </article>
        <article className="stat-card">
          <span>Total Ratings</span>
          <strong>{stats.totalRatings}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            User Management
          </button>

          <button
            type="button"
            className={activeTab === "stores" ? "active" : ""}
            onClick={() => setActiveTab("stores")}
          >
            Store Management
          </button>
        </div>

        {activeTab === "users" && (
          <section>
            <div className="admin-section-heading">
              <div>
                <h2>User Management</h2>
                <p>Create and manage users and store owners.</p>
              </div>
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => {
                  setCreateUserError("");
                  setCreateUserSuccess("");
                  setShowCreateUser(true);
                }}
              >
                + Create User
              </button>
            </div>

            <div className="admin-filters">
              <input
                name="name"
                value={userFilters.name}
                onChange={updateUserFilter}
                placeholder="Search name"
                aria-label="Filter users by name"
              />
              <input
                name="email"
                value={userFilters.email}
                onChange={updateUserFilter}
                placeholder="Search email"
                aria-label="Filter users by email"
              />
              <input
                name="address"
                value={userFilters.address}
                onChange={updateUserFilter}
                placeholder="Search address"
                aria-label="Filter users by address"
              />
              <select
                name="role"
                value={userFilters.role}
                onChange={updateUserFilter}
                aria-label="Filter users by role"
              >
                <option value="">All roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
              </select>
              <select
                name="sortBy"
                value={userFilters.sortBy}
                onChange={updateUserFilter}
                aria-label="Sort users by"
              >
                <option value="name">Sort by name</option>
                <option value="email">Sort by email</option>
                <option value="address">Sort by address</option>
                <option value="role">Sort by role</option>
                <option value="created_at">Sort by date</option>
              </select>
              <select
                name="order"
                value={userFilters.order}
                onChange={updateUserFilter}
                aria-label="User sort order"
              >
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Role</th>
                    <th>Average Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan="6">Loading users...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6">No users found.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.address}</td>
                        <td>
                          <span className={`role-badge role-${String(user.role).toLowerCase()}`}>
                            {user.role === "STORE_OWNER"
                              ? "Store Owner"
                              : user.role === "ADMIN"
                                ? "Administrator"
                                : "Normal User"}
                          </span>
                        </td>
                        <td>
                          {user.role === "STORE_OWNER"
                            ? formatRating(user.averageRating ?? user.average_rating)
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "stores" && (
          <section>
            <div className="admin-section-heading">
              <div>
                <h2>Store Management</h2>
                <p>Create stores and assign a store owner.</p>
              </div>
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => {
                  setCreateStoreError("");
                  setCreateStoreSuccess("");
                  setShowCreateStore(true);
                }}
              >
                + Create Store
              </button>
            </div>

            <div className="admin-filters">
              <input
                name="name"
                value={storeFilters.name}
                onChange={updateStoreFilter}
                placeholder="Search store name"
                aria-label="Filter stores by name"
              />
              <input
                name="email"
                value={storeFilters.email}
                onChange={updateStoreFilter}
                placeholder="Search store email"
                aria-label="Filter stores by email"
              />
              <input
                name="address"
                value={storeFilters.address}
                onChange={updateStoreFilter}
                placeholder="Search store address"
                aria-label="Filter stores by address"
              />
              <select
                name="sortBy"
                value={storeFilters.sortBy}
                onChange={updateStoreFilter}
                aria-label="Sort stores by"
              >
                <option value="name">Sort by name</option>
                <option value="email">Sort by email</option>
                <option value="address">Sort by address</option>
                <option value="rating">Sort by rating</option>
                <option value="id">Sort by ID</option>
              </select>
              <select
                name="order"
                value={storeFilters.order}
                onChange={updateStoreFilter}
                aria-label="Store sort order"
              >
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Store Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Average Rating</th>
                    <th>Total Ratings</th>
                    <th>Owner ID</th>
                  </tr>
                </thead>
                <tbody>
                  {storesLoading ? (
                    <tr>
                      <td colSpan="7">Loading stores...</td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan="7">No stores found.</td>
                    </tr>
                  ) : (
                    stores.map((store) => (
                      <tr key={store.id}>
                        <td>{store.id}</td>
                        <td>{store.name}</td>
                        <td>{store.email}</td>
                        <td>{store.address}</td>
                        <td>
                          {formatRating(
                            store.averageRating ??
                              store.average_rating ??
                              store.rating
                          )}
                        </td>
                        <td>
                          {store.totalRatings ??
                            store.total_ratings ??
                            store.ratingCount ??
                            0}
                        </td>
                        <td>{store.owner_user_id ?? store.ownerUserId ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {showCreateUser && (
        <Modal title="Create User" onClose={closeUserModal}>
          <form className="modal-form" onSubmit={handleCreateUser}>
            <label>
              Full name
              <input
                type="text"
                value={newUser.name}
                minLength={20}
                maxLength={60}
                required
                placeholder="Enter 20–60 character name"
                onChange={(event) =>
                  setNewUser({ ...newUser, name: event.target.value })
                }
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={newUser.email}
                required
                placeholder="user@example.com"
                onChange={(event) =>
                  setNewUser({ ...newUser, email: event.target.value })
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={newUser.password}
                minLength={8}
                maxLength={16}
                required
                autoComplete="new-password"
                placeholder="8–16 characters"
                onChange={(event) =>
                  setNewUser({ ...newUser, password: event.target.value })
                }
              />
              <small>
                Include at least one uppercase letter and one special character.
              </small>
            </label>

            <label>
              Address
              <textarea
                value={newUser.address}
                maxLength={400}
                required
                rows={3}
                placeholder="Enter address"
                onChange={(event) =>
                  setNewUser({ ...newUser, address: event.target.value })
                }
              />
            </label>

            <label>
              User role
              <select
                value={newUser.role}
                required
                onChange={(event) =>
                  setNewUser({ ...newUser, role: event.target.value })
                }
              >
                <option value="USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </label>

            {createUserError && (
              <p className="modal-error" role="alert">
                {createUserError}
              </p>
            )}

            {createUserSuccess && (
              <p className="modal-success" role="status">
                {createUserSuccess}
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeUserModal}
                disabled={creatingUser}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={creatingUser}
              >
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCreateStore && (
        <Modal title="Create Store" onClose={closeStoreModal}>
          <form className="modal-form" onSubmit={handleCreateStore}>
            <label>
              Store name
              <input
                type="text"
                value={newStore.name}
                minLength={20}
                maxLength={60}
                required
                placeholder="Enter 20–60 character store name"
                onChange={(event) =>
                  setNewStore({ ...newStore, name: event.target.value })
                }
              />
            </label>

            <label>
              Store email
              <input
                type="email"
                value={newStore.email}
                required
                placeholder="store@example.com"
                onChange={(event) =>
                  setNewStore({ ...newStore, email: event.target.value })
                }
              />
            </label>

            <label>
              Store address
              <textarea
                value={newStore.address}
                maxLength={400}
                required
                rows={3}
                placeholder="Enter store address"
                onChange={(event) =>
                  setNewStore({ ...newStore, address: event.target.value })
                }
              />
            </label>

            <label>
              Assign store owner
              <select
                value={newStore.ownerUserId}
                required
                onChange={(event) =>
                  setNewStore({
                    ...newStore,
                    ownerUserId: event.target.value,
                  })
                }
              >
                <option value="">Select a store owner</option>
                {storeOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} — {owner.email}
                  </option>
                ))}
              </select>
            </label>

            {storeOwners.length === 0 && (
              <p className="modal-error">
                No store owners are available. Create a user with the Store
                Owner role first.
              </p>
            )}

            {createStoreError && (
              <p className="modal-error" role="alert">
                {createStoreError}
              </p>
            )}

            {createStoreSuccess && (
              <p className="modal-success" role="status">
                {createStoreSuccess}
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeStoreModal}
                disabled={creatingStore}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={creatingStore || storeOwners.length === 0}
              >
                {creatingStore ? "Creating..." : "Create Store"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
