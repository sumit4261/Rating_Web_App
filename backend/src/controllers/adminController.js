
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const VALID_ROLES = ["ADMIN", "USER", "STORE_OWNER"];

async function getDashboardStats(req, res) {
  try {
    const [users] = await pool.execute(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );
    const [stores] = await pool.execute(
      "SELECT COUNT(*) AS totalStores FROM stores"
    );
    const [ratings] = await pool.execute(
      "SELECT COUNT(*) AS totalRatings FROM ratings"
    );

    return res.json({
      success: true,
      data: {
        totalUsers: users[0].totalUsers,
        totalStores: stores[0].totalStores,
        totalRatings: ratings[0].totalRatings,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics",
    });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, address, role } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 20 ||
      name.trim().length > 60
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 20 and 60 characters",
      });
    }

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (
      typeof address !== "string" ||
      address.trim().length > 400
    ) {
      return res.status(400).json({
        success: false,
        message: "Address is required and cannot exceed 400 characters",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-16 characters with an uppercase letter and a special character",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be ADMIN, USER, or STORE_OWNER",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), normalizedEmail, passwordHash, address.trim(), role]
    );

    const [created] = await pool.execute(
      `SELECT id, name, email, address, role, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: created[0],
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Create user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
}

async function getUsers(req, res) {
  try {
    const { name, email, address, role, sortBy = "name", order = "asc" } =
      req.query;

    const allowedSortFields = {
      id: "u.id",
      name: "u.name",
      email: "u.email",
      address: "u.address",
      role: "u.role",
      created_at: "u.created_at",
    };

    if (!allowedSortFields[sortBy]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortBy field",
      });
    }

    const direction = String(order).toLowerCase();

    if (!["asc", "desc"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "order must be asc or desc",
      });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role filter",
      });
    }

    const conditions = [];
    const params = [];

    for (const [field, value] of Object.entries({
      name,
      email,
      address,
    })) {
      if (value !== undefined) {
        conditions.push(`u.${field} LIKE ?`);
        params.push(`%${value}%`);
      }
    }

    if (role) {
      conditions.push("u.role = ?");
      params.push(role);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.address,
        u.role,
        u.created_at,
        CASE
          WHEN u.role = 'STORE_OWNER' THEN ROUND(AVG(r.rating), 2)
          ELSE NULL
        END AS rating
      FROM users u
      LEFT JOIN stores s ON s.owner_user_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY ${allowedSortFields[sortBy]} ${direction.toUpperCase()}
    `;

    const [users] = await pool.execute(sql, params);

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("List users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
}

async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const [users] = await pool.execute(
      `SELECT
         u.id, u.name, u.email, u.address, u.role, u.created_at,
         CASE
           WHEN u.role = 'STORE_OWNER' THEN ROUND(AVG(r.rating), 2)
           ELSE NULL
         END AS rating
       FROM users u
       LEFT JOIN stores s ON s.owner_user_id = u.id
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user details",
    });
  }
}


async function createStore(req, res) {
  try {
    const { name, email, address, ownerUserId } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 20 ||
      name.trim().length > 60
    ) {
      return res.status(400).json({
        success: false,
        message: "Store name must be between 20 and 60 characters",
      });
    }

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid store email",
      });
    }

    if (
      typeof address !== "string" ||
      address.trim().length === 0 ||
      address.trim().length > 400
    ) {
      return res.status(400).json({
        success: false,
        message: "Address is required and cannot exceed 400 characters",
      });
    }

    if (!Number.isSafeInteger(Number(ownerUserId)) || Number(ownerUserId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid store owner ID is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [owners] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'STORE_OWNER'",
      [Number(ownerUserId)]
    );

    if (owners.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The specified store owner does not exist",
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM stores WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A store with this email already exists",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO stores (name, email, address, owner_user_id)
       VALUES (?, ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        address.trim(),
        Number(ownerUserId),
      ]
    );

    const [stores] = await pool.execute(
      `SELECT id, name, email, address, owner_user_id, created_at
       FROM stores WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      store: stores[0],
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A store with this email already exists",
      });
    }

    console.error("Create store error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create store",
    });
  }
}


async function getStores(req, res) {
  try {
    const {
      name,
      email,
      address,
      sortBy = "name",
      order = "asc",
    } = req.query;

    const allowedSortFields = {
      id: "s.id",
      name: "s.name",
      email: "s.email",
      address: "s.address",
      rating: "averageRating",
    };

    if (!allowedSortFields[sortBy]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortBy field",
      });
    }

    const direction = String(order).toLowerCase();

    if (!["asc", "desc"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "order must be asc or desc",
      });
    }

    const conditions = [];
    const params = [];

    for (const [field, value] of Object.entries({
      name,
      email,
      address,
    })) {
      if (value !== undefined) {
        conditions.push(`s.${field} LIKE ?`);
        params.push(`%${value}%`);
      }
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        s.owner_user_id AS ownerUserId,
        ROUND(AVG(r.rating), 2) AS averageRating,
        COUNT(r.id) AS totalRatings
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${allowedSortFields[sortBy]} ${direction.toUpperCase()}
    `;

    const [stores] = await pool.execute(sql, params);

    return res.status(200).json({
      success: true,
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("List stores error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch stores",
    });
  }
}



module.exports = {
  getDashboardStats,
  createUser,
  getUsers,
  getUserById,
  createStore,
  getStores,
};

