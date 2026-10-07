// ==================== UTILS.JS ====================

const Utils = {
    // Settings cache for sync access
    _cachedSettings: null,
    _cachedSymbol: '₹',

    // Update cached settings (call this when settings change)
    async updateCachedSettings() {
        try {
            if (Storage && Storage.isInitialized) {
                this._cachedSettings = await Storage.getSettings();
                this._cachedSymbol = this._cachedSettings?.currencySymbol || '₹';
            }
        } catch (e) {
            console.warn('Could not cache settings:', e);
        }
    },

    // Format currency (sync - uses cached settings)
    formatCurrency(amount) {
        const symbol = this._cachedSymbol || '₹';
        const num = parseFloat(amount) || 0;
        return `${symbol}${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    // Format date
    formatDate(date, format = "short") {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'Invalid Date';
            
            const options = {
                short: { month: "short", day: "numeric", year: "numeric" },
                long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
                time: { hour: "2-digit", minute: "2-digit" },
                full: {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                },
            };
            return d.toLocaleDateString("en-US", options[format] || options.short);
        } catch (e) {
            return 'Invalid Date';
        }
    },

    // Get relative time
    getRelativeTime(date) {
        try {
            const now = new Date();
            const past = new Date(date);
            
            if (isNaN(past.getTime())) return 'Unknown';
            
            const diff = now - past;

            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const weeks = Math.floor(days / 7);
            const months = Math.floor(days / 30);

            if (seconds < 60) return "Just now";
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            if (weeks < 4) return `${weeks}w ago`;
            if (months < 12) return `${months}mo ago`;
            return this.formatDate(date);
        } catch (e) {
            return 'Unknown';
        }
    },

    // Get date range
    getDateRange(period) {
        const now = new Date();
        const start = new Date();

        switch (period) {
            case "today":
                start.setHours(0, 0, 0, 0);
                break;
            case "week":
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start.setMonth(now.getMonth() - 1);
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setMonth(now.getMonth() - 1);
        }

        return { start, end: now };
    },

    // Get transactions by date range - WITH SAFETY CHECK
    getTransactionsByDateRange(transactions, start, end) {
        if (!Array.isArray(transactions)) {
            console.warn('getTransactionsByDateRange: not an array');
            return [];
        }
        
        return transactions.filter((t) => {
            try {
                const date = new Date(t.date);
                return date >= start && date <= end;
            } catch (e) {
                return false;
            }
        });
    },

    // Calculate totals - WITH SAFETY CHECK
    calculateTotals(transactions) {
        if (!Array.isArray(transactions)) {
            console.warn('calculateTotals: not an array');
            return { income: 0, expense: 0, balance: 0 };
        }
        
        return transactions.reduce(
            (acc, t) => {
                const amount = parseFloat(t.amount) || 0;
                if (t.type === "income") {
                    acc.income += amount;
                } else {
                    acc.expense += amount;
                }
                acc.balance = acc.income - acc.expense;
                return acc;
            },
            { income: 0, expense: 0, balance: 0 }
        );
    },

    // Group by category - WITH SAFETY CHECK
    groupByCategory(transactions) {
        if (!Array.isArray(transactions)) {
            console.warn('groupByCategory: not an array');
            return {};
        }
        
        return transactions.reduce((acc, t) => {
            const category = t.category || 'other';
            if (!acc[category]) {
                acc[category] = {
                    total: 0,
                    count: 0,
                    transactions: [],
                };
            }
            acc[category].total += parseFloat(t.amount) || 0;
            acc[category].count++;
            acc[category].transactions.push(t);
            return acc;
        }, {});
    },

    // Group by date - WITH SAFETY CHECK
    groupByDate(transactions, groupBy = "day") {
        if (!Array.isArray(transactions)) {
            console.warn('groupByDate: not an array');
            return {};
        }
        
        return transactions.reduce((acc, t) => {
            try {
                const date = new Date(t.date);
                if (isNaN(date.getTime())) return acc;
                
                let key;

                switch (groupBy) {
                    case "day":
                        key = date.toISOString().split("T")[0];
                        break;
                    case "week":
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = weekStart.toISOString().split("T")[0];
                        break;
                    case "month":
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                        break;
                    default:
                        key = date.toISOString().split("T")[0];
                }

                if (!acc[key]) {
                    acc[key] = { income: 0, expense: 0, transactions: [] };
                }

                const amount = parseFloat(t.amount) || 0;
                if (t.type === "income") {
                    acc[key].income += amount;
                } else {
                    acc[key].expense += amount;
                }
                acc[key].transactions.push(t);

                return acc;
            } catch (e) {
                return acc;
            }
        }, {});
    },

    // Generate insights - NOW ASYNC
    async generateInsights(transactions, budgets) {
        // Safety checks
        if (!Array.isArray(transactions)) transactions = [];
        if (!Array.isArray(budgets)) budgets = [];
        
        const insights = [];
        
        try {
            const { start, end } = this.getDateRange("month");
            const monthTransactions = this.getTransactionsByDateRange(transactions, start, end);
            const totals = this.calculateTotals(monthTransactions);
            const categoryGroups = this.groupByCategory(
                monthTransactions.filter((t) => t.type === "expense")
            );

            const daysInMonth = 30;
            const daysPassed = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));

            if (daysPassed > 7 && totals.expense > 0) {
                const expectedSpending = (totals.expense / daysPassed) * daysInMonth;

                if (expectedSpending > totals.income * 0.8 && totals.income > 0) {
                    insights.push({
                        type: "negative",
                        icon: "fa-exclamation-triangle",
                        title: "High Spending Rate",
                        message: `At this rate, you'll spend ${this.formatCurrency(expectedSpending)} by month end.`,
                    });
                } else if (expectedSpending < totals.income * 0.5 && totals.income > 0) {
                    insights.push({
                        type: "positive",
                        icon: "fa-thumbs-up",
                        title: "Great Saving Rate!",
                        message: `You're on track to save ${this.formatCurrency(totals.income - expectedSpending)} this month.`,
                    });
                }
            }

            const topCategory = Object.entries(categoryGroups).sort(
                (a, b) => b[1].total - a[1].total
            )[0];

            if (topCategory && totals.expense > 0) {
                // Get categories async
                let categories = [];
                try {
                    if (Storage && Storage.isInitialized) {
                        categories = await Storage.getCategories();
                    }
                } catch (e) {
                    categories = [];
                }
                
                if (!Array.isArray(categories)) categories = [];
                
                const categoryInfo = categories.find((c) => c.id === topCategory[0]);
                insights.push({
                    type: "neutral",
                    icon: categoryInfo?.icon || "fa-info-circle",
                    title: "Top Spending Category",
                    message: `${categoryInfo?.name || topCategory[0]} accounts for ${this.formatCurrency(topCategory[1].total)} (${Math.round((topCategory[1].total / totals.expense) * 100)}% of expenses).`,
                });
            }

            budgets.forEach((budget) => {
                const spent = categoryGroups[budget.category]?.total || 0;
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

                if (percentage >= 100) {
                    insights.push({
                        type: "negative",
                        icon: "fa-exclamation-circle",
                        title: "Budget Exceeded!",
                        message: `You've exceeded your ${budget.category} budget by ${this.formatCurrency(spent - budget.amount)}.`,
                    });
                } else if (percentage >= 80) {
                    insights.push({
                        type: "warning",
                        icon: "fa-exclamation",
                        title: "Budget Warning",
                        message: `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget.`,
                    });
                }
            });
        } catch (error) {
            console.error('generateInsights error:', error);
        }

        return insights;
    },

    // Animate counter
    animateCounter(element, target, duration = 1000) {
        if (!element) return;

        const start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * easeOut;

            element.textContent = this.formatCurrency(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Download file
    downloadFile(content, filename, type = "application/json") {
        try {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('downloadFile error:', e);
        }
    },

    // Export to CSV
    exportToCSV(transactions) {
        if (!Array.isArray(transactions)) {
            console.warn('exportToCSV: not an array');
            return;
        }
        
        try {
            const headers = [
                "Date",
                "Description",
                "Category",
                "Type",
                "Amount",
                "Notes",
                "Tags",
            ];
            const rows = transactions.map((t) => [
                t.date || '',
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.category || '',
                t.type || '',
                t.amount || 0,
                `"${(t.notes || '').replace(/"/g, '""')}"`,
                `"${(t.tags || '').replace(/"/g, '""')}"`,
            ]);

            const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            this.downloadFile(
                csv,
                `expenses_${new Date().toISOString().split("T")[0]}.csv`,
                "text/csv"
            );
        } catch (e) {
            console.error('exportToCSV error:', e);
        }
    },

    // Show toast notification
    showToast(message, type = "info") {
        try {
            let container = document.getElementById("toastContainer");

            if (!container) {
                container = document.createElement("div");
                container.id = "toastContainer";
                container.className = "toast-container";
                document.body.appendChild(container);
            }

            const toast = document.createElement("div");
            toast.className = `toast ${type}`;

            const icons = {
                success: "fa-check-circle",
                error: "fa-times-circle",
                warning: "fa-exclamation-circle",
                info: "fa-info-circle",
            };

            toast.innerHTML = `
                <i class="fas ${icons[type] || icons.info}"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add("fade-out");
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }, 3000);
        } catch (e) {
            console.error('showToast error:', e);
        }
    },

    // Get days in month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    // Get first day of month
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },
};