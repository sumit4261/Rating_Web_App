
const express = require("express");
const { getDashboard } = require("../controllers/ownerController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("STORE_OWNER"),
  getDashboard
);

module.exports = router;
