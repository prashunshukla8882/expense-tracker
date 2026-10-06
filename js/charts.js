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

  // Initialize all charts
  init() {
    this.initSpendingChart();
    this.initCategoryChart();
    this.initSparklines();
  },

  // Spending Chart
  initSpendingChart() {
    const ctx = document.getElementById("spendingChart");
    if (!ctx) return;

    if (this.instances.spending) {
      this.instances.spending.destroy();
    }

    const transactions = Storage.getTransactions();
    const grouped = Utils.groupByDate(transactions, "day");
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      labels.push(Utils.formatDate(date, "short").split(",")[0]);
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
          },
        },
      },
    });
  },

  // Category Chart
  initCategoryChart() {
    const ctx = document.getElementById("categoryChart");
    if (!ctx) return;

    if (this.instances.category) {
      this.instances.category.destroy();
    }

    const transactions = Storage.getTransactions().filter(
      (t) => t.type === "expense",
    );
    const categories = Storage.getCategories();
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
  },

  // Sparklines
  initSparklines() {
    const transactions = Storage.getTransactions();
    const grouped = Utils.groupByDate(transactions, "day");

    const incomeData = [];
    const expenseData = [];
    const balanceData = [];

    let runningBalance = 0;
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      incomeData.push(grouped[key]?.income || 0);
      expenseData.push(grouped[key]?.expense || 0);
      runningBalance +=
        (grouped[key]?.income || 0) - (grouped[key]?.expense || 0);
      balanceData.push(runningBalance);
    }

    this.createSparkline("incomeSparkline", incomeData, this.colors.success);
    this.createSparkline("expenseSparkline", expenseData, this.colors.danger);
    this.createSparkline("balanceSparkline", balanceData, this.colors.primary);
    this.createSparkline(
      "savingsSparkline",
      balanceData.map((v) => Math.max(0, v)),
      this.colors.warning,
    );
  },

  createSparkline(id, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    if (this.instances[id]) {
      this.instances[id].destroy();
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

  // Trend Chart
  initTrendChart() {
    const ctx = document.getElementById("trendChart");
    if (!ctx) return;

    if (this.instances.trend) {
      this.instances.trend.destroy();
    }

    const transactions = Storage.getTransactions();
    const grouped = Utils.groupByDate(transactions, "month");
    const labels = [];
    const incomeData = [];
    const expenseData = [];

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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true },
          },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  },

  // Category Pie Chart
  initCategoryPieChart() {
    const ctx = document.getElementById("categoryPieChart");
    if (!ctx) return;

    if (this.instances.categoryPie) {
      this.instances.categoryPie.destroy();
    }

    const transactions = Storage.getTransactions().filter(
      (t) => t.type === "expense",
    );
    const categories = Storage.getCategories();
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
  },

  // Daily Pattern Chart
  initDailyPatternChart() {
    const ctx = document.getElementById("dailyPatternChart");
    if (!ctx) return;

    if (this.instances.dailyPattern) {
      this.instances.dailyPattern.destroy();
    }

    const transactions = Storage.getTransactions().filter(
      (t) => t.type === "expense",
    );
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    transactions.forEach((t) => {
      const day = new Date(t.date).getDay();
      dayTotals[day] += parseFloat(t.amount);
      dayCounts[day]++;
    });

    const avgByDay = dayTotals.map((total, i) =>
      dayCounts[i] > 0 ? total / dayCounts[i] : 0,
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
  },

  // Monthly Comparison
  initMonthlyComparisonChart() {
    const ctx = document.getElementById("monthlyComparisonChart");
    if (!ctx) return;

    if (this.instances.monthlyComparison) {
      this.instances.monthlyComparison.destroy();
    }

    const transactions = Storage.getTransactions();
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthTrans = transactions.filter(
      (t) =>
        new Date(t.date).getMonth() === currentMonth && t.type === "expense",
    );
    const lastMonthTrans = transactions.filter(
      (t) => new Date(t.date).getMonth() === lastMonth && t.type === "expense",
    );

    const categories = Storage.getCategories();
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true },
          },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  },

  // Update all charts
  updateAll() {
    this.initSpendingChart();
    this.initCategoryChart();
    this.initSparklines();
    this.initTrendChart();
    this.initCategoryPieChart();
    this.initDailyPatternChart();
    this.initMonthlyComparisonChart();
  },

  // Destroy all
  destroyAll() {
    Object.values(this.instances).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.instances = {};
  },
};
