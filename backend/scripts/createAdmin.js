
require("dotenv").config();

const readline = require("readline/promises");
const bcrypt = require("bcryptjs");
const { stdin, stdout } = require("process");
const { pool } = require("../src/config/db");

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  try {
    // Bootstrap only the first administrator.
    const [admins] = await pool.execute(
      "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
    );

    if (admins.length > 0) {
      throw new Error(
        "An administrator already exists. Use the admin API to create more."
      );
    }

    const name = (await rl.question("Admin name (20-60 characters): ")).trim();
    const email = (
      await rl.question("Admin email: ")
    ).trim().toLowerCase();
    const address = (await rl.question("Admin address: ")).trim();
    const password = await rl.question("Admin password (input visible): ");

    if (name.length < 20 || name.length > 60) {
      throw new Error("Name must be between 20 and 60 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    if (address.length > 400) {
      throw new Error("Address cannot exceed 400 characters.");
    }

    if (
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new Error(
        "Password must be 8-16 characters with an uppercase letter and a special character."
      );
    }

    const existing = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing[0].length > 0) {
      throw new Error("That email is already registered.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, 'ADMIN')`,
      [name, email, passwordHash, address]
    );

    console.log("Administrator created successfully.");
    console.log(`Email: ${email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
