
const express = require("express");
const { getStores } = require("../controllers/storeController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("USER"));

router.get("/", getStores);

module.exports = router;
