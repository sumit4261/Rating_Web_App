
const pool = require("../config/db");

async function getOwnerDashboard(ownerUserId) {
  const [stores] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.email,
       s.address,
       ROUND(AVG(r.rating), 2) AS averageRating,
       COUNT(r.id) AS totalRatings
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.owner_user_id = ?
     GROUP BY s.id, s.name, s.email, s.address
     ORDER BY s.name ASC`,
    [ownerUserId]
  );

  const [ratings] = await pool.execute(
    `SELECT
       s.id AS storeId,
       s.name AS storeName,
       u.id AS userId,
       u.name AS userName,
       u.email AS userEmail,
       r.rating,
       r.created_at AS ratedAt,
       r.updated_at AS updatedAt
     FROM stores s
     INNER JOIN ratings r ON r.store_id = s.id
     INNER JOIN users u ON u.id = r.user_id
     WHERE s.owner_user_id = ?
     ORDER BY s.name ASC, r.updated_at DESC`,
    [ownerUserId]
  );

  return { stores, ratings };
}

module.exports = { getOwnerDashboard };
