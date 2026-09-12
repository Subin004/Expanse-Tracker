const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function validateCredentials(email, password) {
    if (typeof email !== "string" || !email.trim()) {
        return "A valid email is required.";
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return "Password must contain 8 to 72 characters.";
    }

    return null;
}

router.post("/register", async (request, response) => {
    const { email, password } = request.body;
    const validationMessage = validateCredentials(email, password);

    if (validationMessage) {
        return response.status(400).json({ message: validationMessage });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `
            INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id::TEXT AS id, email, created_at
            `,
            [normalizedEmail, passwordHash]
        );

        return response.status(201).json({
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({
                message: "An account with this email already exists."
            });
        }

        console.error("Registration failed:", error);

        return response.status(500).json({
            message: "Could not create account."
        });
    }
});

router.post("/login", async (request, response) => {
    const { email, password } = request.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return response.status(400).json({
            message: "Email and password are required."
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT id::TEXT AS id, email, password_hash
            FROM users
            WHERE email = $1
            `,
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];
        const passwordMatches = user &&
            await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return response.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return response.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login failed:", error);

        return response.status(500).json({
            message: "Could not log in."
        });
    }
});

module.exports = router;