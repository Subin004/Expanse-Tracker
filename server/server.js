const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const expenses = [
    {
        id: 1,
        name: "Lunch",
        amount: 250,
        category: "Food",
        date: "2026-09-09"
    },
    {
        id: 2,
        name: "Bus fare",
        amount: 30,
        category: "Transport",
        date: "2026-09-09"
    }
];

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

app.get("/api/expenses", (request, response) => {
    response.status(200).json(expenses);
});

app.post("/api/expenses", (request, response) => {
    const validationMessage = validateExpense(request.body);

    if (validationMessage) {
        return response.status(400).json({
            message: validationMessage
        });
    }

    const { name, amount, category, date } = request.body;

    const nextId = expenses.length === 0
        ? 1
        : Math.max(...expenses.map(expense => expense.id)) + 1;

    const newExpense = {
        id: nextId,
        name: name.trim(),
        amount,
        category,
        date
    };

    expenses.push(newExpense);

    return response.status(201).json(newExpense);
});

app.put("/api/expenses/:id", (request, response) => {
    const expenseId = Number(request.params.id);

    if (!Number.isInteger(expenseId)) {
        return response.status(400).json({
            message: "Expense ID must be a valid number."
        });
    }

    const expense = expenses.find(
        expense => expense.id === expenseId
    );

    if (!expense) {
        return response.status(404).json({
            message: "Expense not found."
        });
    }

    const validationMessage = validateExpense(request.body);

    if (validationMessage) {
        return response.status(400).json({
            message: validationMessage
        });
    }

    const { name, amount, category, date } = request.body;

    expense.name = name.trim();
    expense.amount = amount;
    expense.category = category;
    expense.date = date;

    return response.status(200).json(expense);
});

app.delete("/api/expenses/:id", (request, response) => {
    const expenseId = Number(request.params.id);

    if (!Number.isInteger(expenseId)) {
        return response.status(400).json({
            message: "Expense ID must be a valid number."
        });
    }

    const expenseIndex = expenses.findIndex(
        expense => expense.id === expenseId
    );

    if (expenseIndex === -1) {
        return response.status(404).json({
            message: "Expense not found."
        });
    }

    expenses.splice(expenseIndex, 1);

    return response.status(204).send();
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