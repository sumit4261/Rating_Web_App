
const ratingModel = require("../models/ratingModel");
const { pool } = require("../config/db");

// Submit a new rating or update an existing rating
async function submitOrUpdateRating(req, res) {
  try {
    const userId = req.user.id;
    const storeId = Number(req.params.storeId);
    const { rating } = req.body;

    // Validate store ID
    if (!Number.isSafeInteger(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    // Validate rating
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Check whether the store exists
    const [stores] = await pool.execute(
      "SELECT id FROM stores WHERE id = ? LIMIT 1",
      [storeId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const savedRating = await ratingModel.saveRating(
      userId,
      storeId,
      rating
    );

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      rating: savedRating,
    });
  } catch (error) {
    console.error("Submit/update rating error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating",
    });
  }
}

module.exports = {
  submitOrUpdateRating,
};
