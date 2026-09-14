document.addEventListener("DOMContentLoaded", () => {
    const calendarDays = document.getElementById("calendar-days");
    const calendarMonth = document.getElementById("calendar-month");
    const selectedDateLabel = document.getElementById("selected-date-label");
    const selectedExpenseList = document.getElementById("selected-expense-list");
    const previousMonthButton = document.getElementById("previous-month");
    const nextMonthButton = document.getElementById("next-month");
    const clearDateFilterButton = document.getElementById("clear-date-filter");
    const storageKey = "expense-tracker-expenses";

    const expenses = loadExpenses();
    let selectedDate = null;
    let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    renderCalendar();
    renderSelectedExpenses();

    previousMonthButton.addEventListener("click", () => {
        displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener("click", () => {
        displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
        renderCalendar();
    });

    clearDateFilterButton.addEventListener("click", () => {
        selectedDate = null;
        selectedDateLabel.textContent = "Choose a date to see its expenses";
        renderCalendar();
        renderSelectedExpenses();
    });

    calendarDays.addEventListener("click", event => {
        const dayButton = event.target.closest("button[data-date]");

        if (!dayButton) return;

        selectedDate = dayButton.dataset.date;
        selectedDateLabel.textContent = "Showing expenses for " + formatDate(selectedDate);
        renderCalendar();
        renderSelectedExpenses();
    });

    function loadExpenses() {
        try {
            const parsedExpenses = JSON.parse(localStorage.getItem(storageKey));
            return Array.isArray(parsedExpenses) ? parsedExpenses : [];
        } catch {
            return [];
        }
    }

    function renderCalendar() {
        calendarMonth.textContent = displayedMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });
        calendarDays.replaceChildren();

        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const expenseDates = new Set(expenses.map(expense => expense.date));

        for (let emptyDay = 0; emptyDay < firstWeekday; emptyDay += 1) {
            const emptyCell = document.createElement("span");
            emptyCell.className = "calendar-empty";
            calendarDays.append(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = createDateString(year, month, day);
            const dayButton = document.createElement("button");

            dayButton.type = "button";
            dayButton.className = "calendar-day";
            dayButton.dataset.date = date;
            dayButton.textContent = day;
            dayButton.setAttribute("aria-label", formatDate(date));
            dayButton.setAttribute("aria-pressed", String(date === selectedDate));

            if (expenseDates.has(date)) {
                dayButton.classList.add("has-expenses");
                dayButton.setAttribute("aria-label", formatDate(date) + ", has expenses");
            }

            if (date === selectedDate) dayButton.classList.add("is-selected");
            calendarDays.append(dayButton);
        }
    }

    function renderSelectedExpenses() {
        selectedExpenseList.replaceChildren();

        if (!selectedDate) {
            selectedExpenseList.append(createMessage("Select a calendar day to see its expense details."));
            return;
        }

        const selectedExpenses = expenses.filter(expense => expense.date === selectedDate);

        if (!selectedExpenses.length) {
            selectedExpenseList.append(createMessage("No expenses were recorded on this date."));
            return;
        }

        selectedExpenses.forEach(expense => {
            const item = document.createElement("li");
            item.textContent = expense.name + " · " + expense.category + " · ₹" + Number(expense.amount).toFixed(2);
            selectedExpenseList.append(item);
        });
    }

    function createMessage(message) {
        const item = document.createElement("li");
        item.className = "empty-list-message";
        item.textContent = message;
        return item;
    }

    function createDateString(year, month, day) {
        return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }
});
