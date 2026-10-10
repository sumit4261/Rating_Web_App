
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both passwords are required.",
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 16 ||
      !/[A-Z]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8–16 characters with an uppercase letter and special character.",
      });
    }

    const [rows] = await pool.execute(
      "SELECT password_hash FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, req.user.id]
    );

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};
