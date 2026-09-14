document.addEventListener("DOMContentLoaded", () => {
    const analyticsMonth = document.getElementById("analytics-month");
    const analyticsPeriod = document.getElementById("analytics-period");
    const analyticsTotal = document.getElementById("analytics-total");
    const topCategory = document.getElementById("top-category");
    const expenseCount = document.getElementById("expense-count");
    const trendTitle = document.getElementById("trend-title");
    const trendRange = document.getElementById("trend-range");
    const trendChart = document.getElementById("trend-chart");
    const categoryChart = document.getElementById("category-chart");
    const storageKey = "expense-tracker-expenses";
    const expenses = loadExpenses();

    analyticsMonth.value = getMonthInputValue(new Date());
    renderAnalytics();
    analyticsMonth.addEventListener("change", renderAnalytics);
    analyticsPeriod.addEventListener("change", renderAnalytics);

    function loadExpenses() {
        try {
            const parsedExpenses = JSON.parse(localStorage.getItem(storageKey));
            return Array.isArray(parsedExpenses) ? parsedExpenses : [];
        } catch {
            return [];
        }
    }

    function renderAnalytics() {
        const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        const categoryEntries = [...groupExpenses(expenses, expense => expense.category).entries()]
            .sort((a, b) => b[1] - a[1]);

        analyticsTotal.textContent = "₹" + total.toFixed(2);
        expenseCount.textContent = expenses.length;
        topCategory.textContent = categoryEntries.length ? categoryEntries[0][0] : "No expenses yet";
        renderTrendChart();
        renderCategoryChart(categoryEntries);
    }

    function renderTrendChart() {
        const period = analyticsPeriod.value;
        const referenceDate = parseMonthInput(analyticsMonth.value);
        const result = buildTrendEntries(period, referenceDate);
        const names = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" };
        const largestAmount = Math.max(1, ...result.entries.map(([, amount]) => amount));

        trendTitle.textContent = names[period] + " spending trend";
        trendRange.textContent = result.rangeLabel;
        trendChart.replaceChildren();
        trendChart.setAttribute("aria-label", names[period] + " spending trend chart.");

        result.entries.forEach(([key, amount], index) => {
            const column = document.createElement("div");
            const value = document.createElement("span");
            const bar = document.createElement("div");
            const label = document.createElement("span");
            const fullLabel = formatFullPeriodLabel(key, period);

            column.className = "trend-column";
            value.className = "trend-value";
            bar.className = "trend-bar";
            label.className = "trend-label";
            value.textContent = "₹" + amount.toFixed(0);
            bar.style.height = Math.max((amount / largestAmount) * 130, 4) + "px";
            label.textContent = formatShortPeriodLabel(key, period, index);
            column.title = fullLabel + ": ₹" + amount.toFixed(2);
            column.append(value, bar, label);
            trendChart.append(column);
        });
    }

    function buildTrendEntries(period, referenceDate) {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();

        if (period === "day") {
            const totals = groupExpenses(expenses, expense => expense.date);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            return {
                entries: Array.from({ length: daysInMonth }, (_, index) => {
                    const key = createDateString(year, month, index + 1);
                    return [key, totals.get(key) || 0];
                }),
                rangeLabel: "Every day in " + referenceDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
            };
        }

        if (period === "week") {
            const firstWeekStart = new Date(year, 0, 1);
            firstWeekStart.setDate(firstWeekStart.getDate() - ((firstWeekStart.getDay() + 6) % 7));
            const totals = groupExpenses(expenses, expense => getWeekStartKey(expense.date));
            const entries = [];
            const currentWeekStart = new Date(firstWeekStart);

            while (currentWeekStart.getFullYear() < year + 1) {
                const key = createDateString(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
                entries.push([key, totals.get(key) || 0]);
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            }

            return { entries, rangeLabel: "Every week in " + year };
        }

        if (period === "month") {
            const totals = groupExpenses(expenses, expense => expense.date.slice(0, 7));
            return {
                entries: Array.from({ length: 12 }, (_, index) => {
                    const key = year + "-" + String(index + 1).padStart(2, "0");
                    return [key, totals.get(key) || 0];
                }),
                rangeLabel: "Every month in " + year
            };
        }

        const years = expenses.map(expense => Number(expense.date.slice(0, 4)));
        const firstYear = years.length ? Math.min(...years, year) : year;
        const lastYear = years.length ? Math.max(...years, year) : year;
        const totals = groupExpenses(expenses, expense => expense.date.slice(0, 4));
        const entries = [];

        for (let currentYear = firstYear; currentYear <= lastYear; currentYear += 1) {
            const key = String(currentYear);
            entries.push([key, totals.get(key) || 0]);
        }

        return {
            entries,
            rangeLabel: firstYear === lastYear
                ? "All spending in " + firstYear
                : "Every year from " + firstYear + " to " + lastYear
        };
    }

    function renderCategoryChart(categoryEntries) {
        categoryChart.replaceChildren();

        if (!categoryEntries.length) {
            const message = document.createElement("p");
            message.className = "empty-chart-message";
            message.textContent = "Add an expense to see category totals.";
            categoryChart.append(message);
            return;
        }

        const largestAmount = categoryEntries[0][1];
        categoryEntries.forEach(([category, amount]) => {
            const row = document.createElement("div");
            const name = document.createElement("span");
            const track = document.createElement("div");
            const bar = document.createElement("div");
            const value = document.createElement("strong");

            row.className = "category-row";
            track.className = "category-track";
            bar.className = "category-bar";
            name.textContent = category;
            value.textContent = "₹" + amount.toFixed(2);
            bar.style.width = (amount / largestAmount) * 100 + "%";
            track.append(bar);
            row.append(name, track, value);
            categoryChart.append(row);
        });
    }

    function groupExpenses(expensesToGroup, getKey) {
        return expensesToGroup.reduce((groups, expense) => {
            const key = getKey(expense);
            groups.set(key, (groups.get(key) || 0) + Number(expense.amount));
            return groups;
        }, new Map());
    }

    function getWeekStartKey(dateString) {
        const date = parseLocalDate(dateString);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        return createDateString(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function formatShortPeriodLabel(key, period, index) {
        if (period === "day") return String(parseLocalDate(key).getDate());
        if (period === "week") return "W" + (index + 1);
        if (period === "month") return new Date(key + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" });
        return key;
    }

    function formatFullPeriodLabel(key, period) {
        if (period === "month") {
            return new Date(key + "-01T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });
        }
        if (period === "year") return key;
        return parseLocalDate(key).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function parseMonthInput(value) {
        const [year, month] = value.split("-").map(Number);
        return new Date(year, month - 1, 1);
    }

    function getMonthInputValue(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    }

    function parseLocalDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function createDateString(year, month, day) {
        return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }
});
