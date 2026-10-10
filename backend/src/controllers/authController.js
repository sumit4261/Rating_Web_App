const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require("../models/userModel");

async function register(req, res) {
    try {
        const { name, email, password, address } = req.body;

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await userModel.findByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await userModel.createUser({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            address: address.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });
    } 
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }
        console.error("Error during user registration:", error.message);

        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
        });
    }
}

async function login(req, res){
    try{
        const {email, password} = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        const user = await userModel.findByEmail(normalizedEmail);

        if(!user || !(await bcrypt.compare(password, user.password_hash))){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
            );

        const { password_hash, ...safeUser } = user;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser,
        });
    }catch(error){
        console.error("Error during user login:", error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
        });
    }
}

async function getMe(req, res) {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
}

module.exports = {
    register,
    login,
    getMe,
}