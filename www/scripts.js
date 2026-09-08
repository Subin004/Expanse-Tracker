//script.js
document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const totalAmount = document.getElementById("total-amount");
    const filterCategory = document.getElementById("filter-category");
    const submitButton = expenseForm.querySelector('button[type="submit"]');
    const formMessage = document.getElementById("form-message");
    const storageKey = "expense-tracker-expenses";

    let expenses = loadExpenses();
    let editingExpenseId = null;

    renderCurrentExpenses();
    updateTotalAmount();

    expenseForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("expense-name").value.trim();
        const amount = parseFloat(document.getElementById("expense-amount").value);
        const category = document.getElementById("expense-category").value;
        const date = document.getElementById("expense-date").value;

        if (!name || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
            formMessage.textContent = "Enter an expense name, a positive amount, a category, and a date.";
            return;
        }

        const expense = {
            id: editingExpenseId ?? Date.now(),
            name,
            amount,
            category,
            date
        };

        if (editingExpenseId === null) {
            expenses.push(expense);
        } else {
            expenses = expenses.map(existingExpense =>
                existingExpense.id === editingExpenseId ? expense : existingExpense
            );
        }

        saveExpenses();
        renderCurrentExpenses();
        updateTotalAmount();

        expenseForm.reset();
        editingExpenseId = null;
        submitButton.textContent = "Add Expense";
        formMessage.textContent = "";
    });

    expenseList.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const id = parseInt(e.target.dataset.id);
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
            renderCurrentExpenses();
            updateTotalAmount();
        }

        if (e.target.classList.contains("edit-btn")) {
            const id = parseInt(e.target.dataset.id);
            const expense = expenses.find(expense => expense.id === id);

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

    function loadExpenses() {
        const savedExpenses = localStorage.getItem(storageKey);

        if (!savedExpenses) {
            return [];
        }

        try {
            const parsedExpenses = JSON.parse(savedExpenses);
            return Array.isArray(parsedExpenses) ? parsedExpenses : [];
        } catch {
            return [];
        }
    }

    function saveExpenses() {
        localStorage.setItem(storageKey, JSON.stringify(expenses));
    }

    function renderCurrentExpenses() {
        const selectedCategory = filterCategory.value;
        const expensesToDisplay = selectedCategory === "All"
            ? expenses
            : expenses.filter(expense => expense.category === selectedCategory);

        displayExpenses(expensesToDisplay);
    }

    function displayExpenses(expenses) {
        expenseList.innerHTML = "";
        expenses.forEach(expense => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${expense.name}</td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>${expense.category}</td>
                <td>${expense.date}</td>
                <td>
                    <button class="edit-btn" data-id="${expense.id}">Edit</button>
                    <button class="delete-btn" data-id="${expense.id}">Delete</button>
                </td>
            `;

            expenseList.appendChild(row);
        });
    }

    function updateTotalAmount() {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmount.textContent = total.toFixed(2);
    }
});
