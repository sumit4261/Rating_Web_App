
const express = require("express");

const {
  getDashboardStats,
  createUser,
  getUsers,
  getUserById,
  createStore,
  getStores,
} = require("../controllers/adminController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("ADMIN"));

router.get("/dashboard", getDashboardStats);

router.post("/users", createUser);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);

router.post("/stores", createStore);
router.get("/stores", getStores);

module.exports = router;
