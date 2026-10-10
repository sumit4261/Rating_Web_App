const { pool } = require("../config/db");

async function findByEmail(email){
    const [rows] = await pool.execute(
        `SELECT id, name, email, password_hash, address, role
         FROM users
         WHERE email = ?
         LIMIT 1`,
         [email]
    );
    return rows[0] || null;
}

async function createUser({name, email, passwordHash, address}){
    const [result] = await pool.execute(
        `INSERT INTO users (name, email, password_hash, address, role)
        VALUES (?, ?, ?, ?, 'USER')`,
        [name, email, passwordHash, address]
    );
    return findById(result.insertId);
}

async function findById(id){
    const [rows] = await pool.execute(
        `SELECT id, name, email, password_hash, address, role, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
         [id]
    );
    return rows[0] || null;
}

module.exports = {
    findByEmail,
    createUser,
    findById
}