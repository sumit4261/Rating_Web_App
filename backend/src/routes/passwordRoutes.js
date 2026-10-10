
const router = require("express").Router();
const { changePassword } = require("../controllers/passwordController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.put("/", authenticateToken, changePassword);

module.exports = router;
