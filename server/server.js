const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/authRoutes");
const requireAuth = require("./middleware/requireAuth");
const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost",
    "capacitor://localhost"
].filter(Boolean);


app.use(express.json());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Request origin is not allowed."));
    }
}));
app.use("/api/auth", authRoutes);
app.use("/api/expenses", requireAuth);

function validateExpense(expense) {
    const { name, amount, category, date } = expense ?? {};

    const isInvalid =
        typeof name !== "string" ||
        !name.trim() ||
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        typeof category !== "string" ||
        !category ||
        typeof date !== "string" ||
        !date;

    return isInvalid
        ? "Name, positive amount, category, and date are required."
        : null;
}

function getExpenseId(id) {
    const expenseId = Number(id);

    return Number.isSafeInteger(expenseId) && expenseId > 0
        ? expenseId
        : null;
}

app.get("/api/health", async (request, response) => {
    try {
        await pool.query("SELECT 1");

        return response.status(200).json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        return response.status(503).json({
            message: "Database is unavailable."
        });
    }
});

app.get("/api/expenses", async (request, response) => {
    try {
        const result = await pool.query(`
            SELECT
                id::TEXT AS id,
                name,
                amount::DOUBLE PRECISION AS amount,
                category,
                expense_date AS date,
                created_at
            FROM expenses
            WHERE user_id = $1
            ORDER BY id DESC
        `, [request.userId]);

        response.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        response.status(500).json({
            message: "Failed to fetch expenses."
        });
    }
});

app.post("/api/expenses", async (request, response) => {
    try {
        const { name, amount, category, date } = request.body;

        const validationError = validateExpense({
            name,
            amount,
            category,
            date
        });

        if (validationError) {
            return response.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `
            INSERT INTO expenses
                (name, amount, category, expense_date, user_id)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING
                id::TEXT AS id,
                name,
                amount::DOUBLE PRECISION AS amount,
                category,
                expense_date AS date,
                created_at
            `,
            [name.trim(), amount, category.trim(), date, request.userId]
        );

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating expense:", error);
        response.status(500).json({
            message: "Failed to create expense."
        });
    }
});

app.put("/api/expenses/:id", async (request, response) => {
    try {
        const expenseId = getExpenseId(request.params.id);
        const { name, amount, category, date } = request.body;

        if (expenseId === null) {
            return response.status(400).json({
                message: "Expense ID must be a positive whole number."
            });
        }

        const validationError = validateExpense({
            name,
            amount,
            category,
            date
        });

        if (validationError) {
            return response.status(400).json({
                message: validationError
            });
        }

        const result = await pool.query(
            `
            UPDATE expenses
            SET
                name = $1,
                amount = $2,
                category = $3,
                expense_date = $4
            WHERE id = $5 and user_id = $6
            RETURNING
                id::TEXT AS id,
                name,
                amount::DOUBLE PRECISION AS amount,
                category,
                expense_date AS date,
                created_at
            `,
            [name.trim(), amount, category.trim(), date, expenseId, request.userId]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Expense not found."
            });
        }

        response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error updating expense:", error);
        response.status(500).json({
            message: "Failed to update expense."
        });
    }
});

app.delete("/api/expenses/:id", async (request, response) => {
    try {
        const expenseId = getExpenseId(request.params.id);

        if (expenseId === null) {
            return response.status(400).json({
                message: "Expense ID must be a positive whole number."
            });
        }

        const result = await pool.query(
            "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
            [expenseId, request.userId]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({
                message: "Expense not found."
            });
        }

        response.status(204).send();
    } catch (error) {
        console.error("Error deleting expense:", error);
        response.status(500).json({
            message: "Failed to delete expense."
        });
    }
});


app.use((error, request, response, next) => {
    if (error.type === "entity.parse.failed") {
        return response.status(400).json({
            message: "Request body must contain valid JSON."
        });
    }

    console.error(error);

    return response.status(500).json({
        message: "Unexpected server error."
    });
});

app.listen(PORT, () => {
    console.log(`Expense Tracker API is running at http://localhost:${PORT}`);
});
