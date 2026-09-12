document.addEventListener("DOMContentLoaded", () => {
    const apiBaseUrl = "http://localhost:3000/api";
    const tokenStorageKey = "expense-tracker-token";
    const emailStorageKey = "expense-tracker-email";

    const authSection = document.getElementById("auth-section");
    const trackerSection = document.getElementById("tracker-section");
    const authForm = document.getElementById("auth-form");
    const authEmail = document.getElementById("auth-email");
    const authPassword = document.getElementById("auth-password");
    const authMessage = document.getElementById("auth-message");
    const registerButton = document.getElementById("register-button");
    const logoutButton = document.getElementById("logout-button");
    const currentUser = document.getElementById("current-user");

    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const totalAmount = document.getElementById("total-amount");
    const filterCategory = document.getElementById("filter-category");
    const submitButton = expenseForm.querySelector('button[type="submit"]');
    const formMessage = document.getElementById("form-message");

    let authToken = sessionStorage.getItem(tokenStorageKey);
    let expenses = [];
    let editingExpenseId = null;

    initializeApp();

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await logIn();
    });

    registerButton.addEventListener("click", async () => {
        await register();
    });

    logoutButton.addEventListener("click", () => {
        logOut();
    });

    expenseForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("expense-name").value.trim();
        const amount = Number(document.getElementById("expense-amount").value);
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
            const id = event.target.dataset.id;

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

            if (!expense) {
                formMessage.textContent =
                    "Expense not found. Refresh and try again.";
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
        if (!authToken) {
            showAuth();
            return;
        }

        showTracker();

        try {
            await loadExpenses();
        } catch {
            logOut("Your session ended. Please log in again.");
        }
    }

    async function register() {
        const credentials = getCredentials();

        if (!credentials) {
            return;
        }

        try {
            await requestApi(
                "/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify(credentials)
                },
                false
            );

            authPassword.value = "";
            authMessage.textContent =
                "Account created. You can now log in.";
        } catch (error) {
            authMessage.textContent = error.message;
        }
    }

    async function logIn() {
        const credentials = getCredentials();

        if (!credentials) {
            return;
        }

        try {
            const responseData = await requestApi(
                "/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify(credentials)
                },
                false
            );

            authToken = responseData.token;
            sessionStorage.setItem(tokenStorageKey, authToken);
            sessionStorage.setItem(emailStorageKey, responseData.user.email);

            authPassword.value = "";
            authMessage.textContent = "";
            showTracker();

            await loadExpenses();
        } catch (error) {
            authMessage.textContent = error.message;
        }
    }

    function getCredentials() {
        const email = authEmail.value.trim();
        const password = authPassword.value;

        if (!email || password.length < 8) {
            authMessage.textContent =
                "Enter an email and a password with at least 8 characters.";
            return null;
        }

        return { email, password };
    }

    function logOut(message = "") {
        authToken = null;
        expenses = [];
        editingExpenseId = null;

        sessionStorage.removeItem(tokenStorageKey);
        sessionStorage.removeItem(emailStorageKey);

        expenseForm.reset();
        expenseList.replaceChildren();
        totalAmount.textContent = "0";
        formMessage.textContent = "";

        showAuth();
        authMessage.textContent = message;
    }

    function showAuth() {
        authSection.hidden = false;
        trackerSection.hidden = true;
    }

    function showTracker() {
        const email = sessionStorage.getItem(emailStorageKey);

        currentUser.textContent = email || "Signed in";
        authSection.hidden = true;
        trackerSection.hidden = false;
    }

    async function loadExpenses() {
        expenses = await requestApi("/expenses");
        renderCurrentExpenses();
        updateTotalAmount();
    }

    async function requestApi(path, options = {}, includeAuth = true) {
        const { headers: extraHeaders = {}, ...requestOptions } = options;

        const headers = {
            "Content-Type": "application/json",
            ...extraHeaders
        };

        if (includeAuth && authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${apiBaseUrl}${path}`, {
            ...requestOptions,
            headers
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

        expenseList.replaceChildren();

        expensesToDisplay.forEach(expense => {
            const row = document.createElement("tr");

            row.append(
                createTableCell(expense.name),
                createTableCell(`₹${Number(expense.amount).toFixed(2)}`),
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
            (sum, expense) => sum + Number(expense.amount),
            0
        );

        totalAmount.textContent = total.toFixed(2);
    }
});