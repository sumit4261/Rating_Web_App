
const { pool } = require("../config/db");

// Find a user's rating for a particular store
async function findUserRating(userId, storeId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, store_id, rating, created_at, updated_at
     FROM ratings
     WHERE user_id = ? AND store_id = ?
     LIMIT 1`,
    [userId, storeId]
  );

  return rows[0] || null;
}

// Create a new rating or update the existing rating
async function saveRating(userId, storeId, rating) {
  await pool.execute(
    `INSERT INTO ratings (user_id, store_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       rating = ?,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, storeId, rating, rating]
  );

  return findUserRating(userId, storeId);
}

// Calculate a store's average rating and total ratings
async function getStoreRatingSummary(storeId) {
  const [rows] = await pool.execute(
    `SELECT
       ROUND(AVG(rating), 2) AS averageRating,
       COUNT(*) AS totalRatings
     FROM ratings
     WHERE store_id = ?`,
    [storeId]
  );

  return {
    averageRating:
      rows[0].averageRating === null
        ? null
        : Number(rows[0].averageRating),
    totalRatings: Number(rows[0].totalRatings),
  };
}

module.exports = {
  findUserRating,
  saveRating,
  getStoreRatingSummary,
};
