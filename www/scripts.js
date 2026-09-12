document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const totalAmount = document.getElementById("total-amount");
    const filterCategory = document.getElementById("filter-category");
    const submitButton = expenseForm.querySelector('button[type="submit"]');
    const formMessage = document.getElementById("form-message");
    const apiBaseUrl = "http://localhost:3000/api";

    let expenses = [];
    let editingExpenseId = null;

    initializeApp();

    expenseForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("expense-name").value.trim();
        const amount = parseFloat(document.getElementById("expense-amount").value);
        const category = document.getElementById("expense-category").value;
        const date = document.getElementById("expense-date").value;

        if (!name || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
            formMessage.textContent =
                "Enter an expense name, a positive amount, a category, and a date.";
            return;
        }

        const expense = { name, amount, category, date };

        try {
            if (editingExpenseId === null) {
                await requestApi("/expenses", {
                    method: "POST",
                    body: JSON.stringify(expense)
                });
            } else {
                await requestApi(`/expenses/${editingExpenseId}`, {
                    method: "PUT",
                    body: JSON.stringify(expense)
                });
            }

            await loadExpenses();
            expenseForm.reset();
            editingExpenseId = null;
            submitButton.textContent = "Add Expense";
            formMessage.textContent = "";
        } catch (error) {
            formMessage.textContent = error.message;
        }
    });

    expenseList.addEventListener("click", async (event) => {
        if (event.target.classList.contains("delete-btn")) {
            const id = Number(event.target.dataset.id);

            try {
                await requestApi(`/expenses/${id}`, {
                    method: "DELETE"
                });

                await loadExpenses();
                formMessage.textContent = "";
            } catch (error) {
                formMessage.textContent = error.message;
            }
        }

        if (event.target.classList.contains("edit-btn")) {
            const id = event.target.dataset.id;
            const expense = expenses.find(
                existingExpense => String(existingExpense.id) === id
            );

            if(!expense){
                formMessage.textContent = "Expense not found. Refresh and try again.";
                return;
            }

            document.getElementById("expense-name").value = expense.name;
            document.getElementById("expense-amount").value = expense.amount;
            document.getElementById("expense-category").value = expense.category;
            document.getElementById("expense-date").value = expense.date;

            editingExpenseId = id;
            submitButton.textContent = "Save Changes";
        }
    });

    filterCategory.addEventListener("change", () => {
        renderCurrentExpenses();
    });

    async function initializeApp() {
        await loadExpenses();
    }

    async function loadExpenses() {
        try {
            expenses = await requestApi("/expenses");
            renderCurrentExpenses();
            updateTotalAmount();
        } catch (error) {
            formMessage.textContent =
                `Could not load expenses: ${error.message}`;
        }
    }

    async function requestApi(path, options = {}) {
        const response = await fetch(`${apiBaseUrl}${path}`, {
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        const responseData = response.status === 204
            ? null
            : await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.message ||
                `Request failed with status ${response.status}.`
            );
        }

        return responseData;
    }

    function renderCurrentExpenses() {
        const selectedCategory = filterCategory.value;
        const expensesToDisplay = selectedCategory === "All"
            ? expenses
            : expenses.filter(expense => expense.category === selectedCategory);

        displayExpenses(expensesToDisplay);
    }

    function displayExpenses(expensesToDisplay) {
        expenseList.replaceChildren();

        expensesToDisplay.forEach(expense => {
            const row = document.createElement("tr");

            row.append(
                createTableCell(expense.name),
                createTableCell(`₹${expense.amount.toFixed(2)}`),
                createTableCell(expense.category),
                createTableCell(expense.date),
                createActionCell(expense.id)
            );

            expenseList.appendChild(row);
        });
    }

    function createTableCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        return cell;
    }

    function createActionCell(expenseId) {
        const cell = document.createElement("td");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        editButton.className = "edit-btn";
        editButton.dataset.id = expenseId;
        editButton.textContent = "Edit";

        deleteButton.className = "delete-btn";
        deleteButton.dataset.id = expenseId;
        deleteButton.textContent = "Delete";

        cell.append(editButton, deleteButton);
        return cell;
    }

    function updateTotalAmount() {
        const total = expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );

        totalAmount.textContent = total.toFixed(2);
    }
});