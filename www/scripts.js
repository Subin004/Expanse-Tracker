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

    expenseForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("expense-name").value.trim();
        const amount = Number(document.getElementById("expense-amount").value);
        const category = document.getElementById("expense-category").value;
        const date = document.getElementById("expense-date").value;

        if (!name || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
            formMessage.textContent = "Enter an expense name, a positive amount, a category, and a date.";
            return;
        }

        const expense = { id: editingExpenseId ?? Date.now(), name, amount, category, date };
        expenses = editingExpenseId === null
            ? [...expenses, expense]
            : expenses.map(existingExpense =>
                existingExpense.id === editingExpenseId ? expense : existingExpense
            );

        saveExpenses();
        resetForm();
        renderCurrentExpenses();
        updateTotalAmount();
    });

    expenseList.addEventListener("click", event => {
        const id = Number(event.target.dataset.id);

        if (event.target.classList.contains("delete-btn")) {
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
            renderCurrentExpenses();
            updateTotalAmount();
        }

        if (event.target.classList.contains("edit-btn")) {
            const expense = expenses.find(existingExpense => existingExpense.id === id);

            if (!expense) {
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
        updateTotalAmount();
    });

    function loadExpenses() {
        try {
            const parsedExpenses = JSON.parse(localStorage.getItem(storageKey));
            return Array.isArray(parsedExpenses) ? parsedExpenses : [];
        } catch {
            return [];
        }
    }

    function saveExpenses() {
        localStorage.setItem(storageKey, JSON.stringify(expenses));
    }

    function resetForm() {
        expenseForm.reset();
        editingExpenseId = null;
        submitButton.textContent = "Add Expense";
        formMessage.textContent = "";
    }

    function renderCurrentExpenses() {
        expenseList.replaceChildren();

        getVisibleExpenses().forEach(expense => {
            const row = document.createElement("tr");
            row.append(
                createTableCell(expense.name),
                createTableCell("₹" + expense.amount.toFixed(2)),
                createTableCell(expense.category),
                createTableCell(expense.date),
                createActionCell(expense.id)
            );
            expenseList.append(row);
        });
    }

    function updateTotalAmount() {
        const total = getVisibleExpenses().reduce((sum, expense) => sum + expense.amount, 0);
        totalAmount.textContent = total.toFixed(2);
    }

    function getVisibleExpenses() {
        return expenses.filter(expense =>
            filterCategory.value === "All" || expense.category === filterCategory.value
        );
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
});
