const express = require("express");
const cors = require("cors");
const pool = require("./db");



const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

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

app.get("/api/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "Expense Tracker API is running"
    });
});

app.get("/api/expenses", async (request, response) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                amount,
                category,
                expense_date AS date,
                created_at
            FROM expenses
            ORDER BY id DESC
        `);

        response.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        response.status(500).json({
            error: "Failed to fetch expenses"
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
                error: validationError
            });
        }

        const result = await pool.query(
            `
            INSERT INTO expenses
                (name, amount, category, expense_date)
            VALUES
                ($1, $2, $3, $4)
            RETURNING
                id,
                name,
                amount,
                category,
                expense_date AS date,
                created_at
            `,
            [name.trim(), amount, category.trim(), date]
        );

        response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating expense:", error);
        response.status(500).json({
            error: "Failed to create expense"
        });
    }
});

app.put("/api/expenses/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const { name, amount, category, date } = request.body;

        const validationError = validateExpense({
            name,
            amount,
            category,
            date
        });

        if (validationError) {
            return response.status(400).json({
                error: validationError
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
            WHERE id = $5
            RETURNING
                id,
                name,
                amount,
                category,
                expense_date AS date,
                created_at
            `,
            [name.trim(), amount, category.trim(), date, id]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                error: "Expense not found"
            });
        }

        response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error updating expense:", error);
        response.status(500).json({
            error: "Failed to update expense"
        });
    }
});

app.delete("/api/expenses/:id", async (request, response) => {
    try {
        const { id } = request.params;

        const result = await pool.query(
            "DELETE FROM expenses WHERE id = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return response.status(404).json({
                error: "Expense not found"
            });
        }

        response.status(204).send();
    } catch (error) {
        console.error("Error deleting expense:", error);
        response.status(500).json({
            error: "Failed to delete expense"
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