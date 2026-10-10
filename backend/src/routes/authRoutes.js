const express = require('express');

const { body, validationResult } = require('express-validator');

const authController = require("../controllers/authController");

const{
    authenticateToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            success: false,
            message: "Validation Failed",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            })),
        });
    }

    next();
};

const nameRule = body('name')
.trim()
.isLength({ min: 20, max: 60})
.withMessage('Name must be between 20 and 60 characters');

const emailRule = body('email')
.trim()
.isEmail()
.withMessage("Enter a valid email address");

const passwordRule = body('password')
.isLength({ min: 8, max: 16 })
.withMessage('Password must be between 8 and 16 characters')
.matches(/[A-Z]/)
.withMessage('Password must contain at least one uppercase letter')
.matches(/[^A-Za-z0-9]/)
.withMessage('Password must contain at least one special character');

const addressRule = body("address")
  .trim()
  .isLength({ max: 400 })
  .withMessage("Address cannot exceed 400 characters");

router.post(
  "/register",
  [nameRule, emailRule, passwordRule, addressRule],
  validateRequest,
  authController.register
);

router.post(
  "/login",
  [
    emailRule,
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required"),
  ],
  validateRequest,
  authController.login
);

router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
