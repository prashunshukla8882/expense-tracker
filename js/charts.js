// ==================== CHARTS.JS ====================

const Charts = {
    instances: {},
    colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
    },

    // Check if Chart.js is loaded
    isChartJsLoaded() {
        return typeof Chart !== 'undefined';
    },

    // Initialize all charts - ASYNC
    async init() {
        if (!this.isChartJsLoaded()) {
            console.warn('Chart.js not loaded yet');
            return;
        }

        try {
            console.log('Initializing charts...');
            await this.initSpendingChart();
            await this.initCategoryChart();
            await this.initSparklines();
            console.log('Charts initialized successfully');
        } catch (error) {
            console.error('Charts init error:', error);
        }
    },

    // Get chart default options
    getDefaultOptions(type = 'bar') {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e2e8f0' : '#374151';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 20,
                    }
                }
            },
            scales: type !== 'doughnut' && type !== 'pie' ? {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            } : undefined
        };
    },

    // Spending Chart (Bar Chart)
    async initSpendingChart() {
        const ctx = document.getElementById("spendingChart");
        if (!ctx) {
            console.log('spendingChart canvas not found');
            return;
        }

        // Destroy existing chart
        if (this.instances.spending) {
            this.instances.spending.destroy();
        }

        try {
            let transactions = [];
            
            // Check if Storage is initialized
            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                transactions = await Storage.getTransactions();
            }

            // Ensure transactions is an array
            if (!Array.isArray(transactions)) {
                transactions = [];
            }

            console.log('Spending chart - transactions:', transactions.length);

            const grouped = Utils.groupByDate(transactions, "day");
            const labels = [];
            const incomeData = [];
            const expenseData = [];

            // Get last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split("T")[0];
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                labels.push(`${dayName} ${dayNum}`);
                incomeData.push(grouped[key]?.income || 0);
                expenseData.push(grouped[key]?.expense || 0);
            }

            this.instances.spending = new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Income",
                            data: incomeData,
                            backgroundColor: this.colors.success,
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                        {
                            label: "Expenses",
                            data: expenseData,
                            backgroundColor: this.colors.danger,
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                    ],
                },
                options: {
                    ...this.getDefaultOptions('bar'),
                    plugins: {
                        legend: {
                            position: "top",
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                            },
                        },
                    },
                },
            });

            console.log('Spending chart created');
        } catch (error) {
            console.error('initSpendingChart error:', error);
        }
    },

    // Category Chart (Doughnut)
    async initCategoryChart() {
        const ctx = document.getElementById("categoryChart");
        if (!ctx) {
            console.log('categoryChart canvas not found');
            return;
        }

        // Destroy existing chart
        if (this.instances.category) {
            this.instances.category.destroy();
        }

        try {
            let transactions = [];
            let categories = [];

            // Check if Storage is initialized
            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                const allTransactions = await Storage.getTransactions();
                transactions = Array.isArray(allTransactions) 
                    ? allTransactions.filter((t) => t.type === "expense") 
                    : [];
                categories = await Storage.getCategories();
                if (!Array.isArray(categories)) categories = [];
            }

            console.log('Category chart - expenses:', transactions.length);

            const grouped = Utils.groupByCategory(transactions);

            const labels = [];
            const data = [];
            const colors = [];

            Object.entries(grouped)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 6)
                .forEach(([categoryId, info]) => {
                    const category = categories.find((c) => c.id === categoryId);
                    labels.push(category?.name || categoryId);
                    data.push(info.total);
                    colors.push(category?.color || "#64748b");
                });

            // If no data, show placeholder
            if (data.length === 0) {
                data.push(1);
                labels.push("No Data");
                colors.push("#e2e8f0");
            }

            this.instances.category = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: colors,
                            borderWidth: 0,
                            cutout: "70%",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                            },
                        },
                    },
                },
            });

            console.log('Category chart created');
        } catch (error) {
            console.error('initCategoryChart error:', error);
        }
    },

    // Sparklines
    async initSparklines() {
        try {
            let transactions = [];

            // Check if Storage is initialized
            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                transactions = await Storage.getTransactions();
            }

            if (!Array.isArray(transactions)) transactions = [];

            const grouped = Utils.groupByDate(transactions, "day");

            const incomeData = [];
            const expenseData = [];
            const balanceData = [];

            let runningBalance = 0;
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split("T")[0];
                const income = grouped[key]?.income || 0;
                const expense = grouped[key]?.expense || 0;
                incomeData.push(income);
                expenseData.push(expense);
                runningBalance += income - expense;
                balanceData.push(runningBalance);
            }

            this.createSparkline("incomeSparkline", incomeData, this.colors.success);
            this.createSparkline("expenseSparkline", expenseData, this.colors.danger);
            this.createSparkline("balanceSparkline", balanceData, this.colors.primary);
            this.createSparkline("savingsSparkline", balanceData.map((v) => Math.max(0, v)), this.colors.warning);

            console.log('Sparklines created');
        } catch (error) {
            console.error('initSparklines error:', error);
        }
    },

    createSparkline(id, data, color) {
        const ctx = document.getElementById(id);
        if (!ctx) return;

        // Destroy existing chart
        if (this.instances[id]) {
            this.instances[id].destroy();
        }

        // Ensure data has some variation for display
        if (data.every(v => v === 0)) {
            data = [0, 0.1, 0, 0.1, 0, 0.1, 0]; // Minimal variation to show line
        }

        this.instances[id] = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.map(() => ""),
                datasets: [
                    {
                        data,
                        borderColor: color,
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: `${color}20`,
                        tension: 0.4,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false },
                },
            },
        });
    },

    // Trend Chart (Line Chart - Analytics Page)
    async initTrendChart() {
        const ctx = document.getElementById("trendChart");
        if (!ctx) return;

        if (this.instances.trend) {
            this.instances.trend.destroy();
        }

        try {
            let transactions = [];

            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                transactions = await Storage.getTransactions();
            }

            if (!Array.isArray(transactions)) transactions = [];

            const grouped = Utils.groupByDate(transactions, "month");
            const labels = [];
            const incomeData = [];
            const expenseData = [];

            // Get last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                labels.push(date.toLocaleDateString("en-US", { month: "short" }));
                incomeData.push(grouped[key]?.income || 0);
                expenseData.push(grouped[key]?.expense || 0);
            }

            this.instances.trend = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Income",
                            data: incomeData,
                            borderColor: this.colors.success,
                            backgroundColor: `${this.colors.success}20`,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: "Expenses",
                            data: expenseData,
                            borderColor: this.colors.danger,
                            backgroundColor: `${this.colors.danger}20`,
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    ...this.getDefaultOptions('line'),
                    plugins: {
                        legend: {
                            position: "top",
                            labels: { usePointStyle: true },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('initTrendChart error:', error);
        }
    },

    // Category Pie Chart (Analytics Page)
    async initCategoryPieChart() {
        const ctx = document.getElementById("categoryPieChart");
        if (!ctx) return;

        if (this.instances.categoryPie) {
            this.instances.categoryPie.destroy();
        }

        try {
            let transactions = [];
            let categories = [];

            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                const allTransactions = await Storage.getTransactions();
                transactions = Array.isArray(allTransactions) 
                    ? allTransactions.filter((t) => t.type === "expense")
                    : [];
                categories = await Storage.getCategories();
                if (!Array.isArray(categories)) categories = [];
            }

            const grouped = Utils.groupByCategory(transactions);

            const labels = [];
            const data = [];
            const colors = [];

            Object.entries(grouped)
                .sort((a, b) => b[1].total - a[1].total)
                .forEach(([categoryId, info]) => {
                    const category = categories.find((c) => c.id === categoryId);
                    labels.push(category?.name || categoryId);
                    data.push(info.total);
                    colors.push(category?.color || "#64748b");
                });

            if (data.length === 0) {
                data.push(1);
                labels.push("No Data");
                colors.push("#e2e8f0");
            }

            this.instances.categoryPie = new Chart(ctx, {
                type: "pie",
                data: {
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: "#fff",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { usePointStyle: true, padding: 15 },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('initCategoryPieChart error:', error);
        }
    },

    // Daily Pattern Chart (Radar - Analytics Page)
    async initDailyPatternChart() {
        const ctx = document.getElementById("dailyPatternChart");
        if (!ctx) return;

        if (this.instances.dailyPattern) {
            this.instances.dailyPattern.destroy();
        }

        try {
            let transactions = [];

            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                const allTransactions = await Storage.getTransactions();
                transactions = Array.isArray(allTransactions) 
                    ? allTransactions.filter((t) => t.type === "expense")
                    : [];
            }

            const dayTotals = new Array(7).fill(0);
            const dayCounts = new Array(7).fill(0);

            transactions.forEach((t) => {
                const day = new Date(t.date).getDay();
                dayTotals[day] += parseFloat(t.amount) || 0;
                dayCounts[day]++;
            });

            const avgByDay = dayTotals.map((total, i) =>
                dayCounts[i] > 0 ? total / dayCounts[i] : 0
            );

            this.instances.dailyPattern = new Chart(ctx, {
                type: "radar",
                data: {
                    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    datasets: [
                        {
                            label: "Avg Spending",
                            data: avgByDay,
                            backgroundColor: `${this.colors.primary}40`,
                            borderColor: this.colors.primary,
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        r: { beginAtZero: true },
                    },
                },
            });
        } catch (error) {
            console.error('initDailyPatternChart error:', error);
        }
    },

    // Monthly Comparison Chart (Bar - Analytics Page)
    async initMonthlyComparisonChart() {
        const ctx = document.getElementById("monthlyComparisonChart");
        if (!ctx) return;

        if (this.instances.monthlyComparison) {
            this.instances.monthlyComparison.destroy();
        }

        try {
            let transactions = [];
            let categories = [];

            if (typeof Storage !== 'undefined' && Storage.isInitialized) {
                transactions = await Storage.getTransactions();
                categories = await Storage.getCategories();
            }

            if (!Array.isArray(transactions)) transactions = [];
            if (!Array.isArray(categories)) categories = [];

            const currentMonth = new Date().getMonth();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

            const currentMonthTrans = transactions.filter(
                (t) => new Date(t.date).getMonth() === currentMonth && t.type === "expense"
            );
            const lastMonthTrans = transactions.filter(
                (t) => new Date(t.date).getMonth() === lastMonth && t.type === "expense"
            );

            const currentGrouped = Utils.groupByCategory(currentMonthTrans);
            const lastGrouped = Utils.groupByCategory(lastMonthTrans);

            const labels = [];
            const currentData = [];
            const lastData = [];

            categories.slice(0, 5).forEach((cat) => {
                labels.push(cat.name);
                currentData.push(currentGrouped[cat.id]?.total || 0);
                lastData.push(lastGrouped[cat.id]?.total || 0);
            });

            if (labels.length === 0) {
                labels.push("No Data");
                currentData.push(0);
                lastData.push(0);
            }

            this.instances.monthlyComparison = new Chart(ctx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "This Month",
                            data: currentData,
                            backgroundColor: this.colors.primary,
                            borderRadius: 4,
                        },
                        {
                            label: "Last Month",
                            data: lastData,
                            backgroundColor: `${this.colors.primary}60`,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    ...this.getDefaultOptions('bar'),
                    plugins: {
                        legend: {
                            position: "top",
                            labels: { usePointStyle: true },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('initMonthlyComparisonChart error:', error);
        }
    },

    // Update all charts - ASYNC
    async updateAll() {
        if (!this.isChartJsLoaded()) {
            console.warn('Chart.js not loaded');
            return;
        }

        try {
            console.log('Updating all charts...');
            await this.initSpendingChart();
            await this.initCategoryChart();
            await this.initSparklines();
            await this.initTrendChart();
            await this.initCategoryPieChart();
            await this.initDailyPatternChart();
            await this.initMonthlyComparisonChart();
            console.log('All charts updated');
        } catch (error) {
            console.error('Charts updateAll error:', error);
        }
    },

    // Destroy all charts
    destroyAll() {
        Object.keys(this.instances).forEach((key) => {
            if (this.instances[key]) {
                this.instances[key].destroy();
                this.instances[key] = null;
            }
        });
        this.instances = {};
        console.log('All charts destroyed');
    },
};