
const express = require("express");
const {
  submitOrUpdateRating,
} = require("../controllers/ratingController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("USER"));

router.post("/:storeId", submitOrUpdateRating);

module.exports = router;
