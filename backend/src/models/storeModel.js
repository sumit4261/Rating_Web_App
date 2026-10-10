
const { pool } = require("../config/db");

async function getStoresForUser(userId, { name = "", address = "" } = {}) {
  const searchName = `%${name}%`;
  const searchAddress = `%${address}%`;

  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.email,
       s.address,
       ROUND(AVG(all_ratings.rating), 2) AS averageRating,
       COUNT(all_ratings.id) AS totalRatings,
       my_rating.rating AS userRating
     FROM stores s
     LEFT JOIN ratings AS all_ratings
       ON all_ratings.store_id = s.id
     LEFT JOIN ratings AS my_rating
       ON my_rating.store_id = s.id
       AND my_rating.user_id = ?
     WHERE s.name LIKE ?
       AND s.address LIKE ?
     GROUP BY s.id, my_rating.rating
     ORDER BY s.name ASC`,
    [userId, searchName, searchAddress]
  );

  return rows.map((store) => ({
    ...store,
    averageRating:
      store.averageRating === null
        ? null
        : Number(store.averageRating),
    totalRatings: Number(store.totalRatings),
    userRating:
      store.userRating === null ? null : Number(store.userRating),
  }));
}

module.exports = { getStoresForUser };
