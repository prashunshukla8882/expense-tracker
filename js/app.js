// ==================== APP.JS - COMPLETE EXPENSE TRACKER APPLICATION ====================

const App = {
    // ==================== STATE VARIABLES ====================
    currentPage: "dashboard",
    editingTransaction: null,
    editingBorrow: null,
    editingWishlist: null,
    editingNote: null,
    selectedDate: new Date(),
    currentCalendarMonth: new Date(),
    currentViewingNote: null,

    // ==================== INITIALIZATION ====================
    async init() {
        console.log("Initializing ExpenseFlow App...");

        // Initialize all modules (these don't need async)
        this.initSplashScreen();
        this.initNavigation();
        await this.initTheme();
        this.initModals();
        this.initTransactionForm();
        this.initBudgetForm();
        this.initCategoryForm();
        this.initSettings();
        this.initCalendar();
        this.initSearch();
        this.initNotifications();
        this.initExport();
        this.initFilters();
        this.initDropdownClose();

        // Initialize new modules
        this.initBorrowModule();
        this.initWishlistModule();
        this.initNotesModule();

        // Update cached settings for Utils
        await Utils.updateCachedSettings();
        
        await this.updateCurrencySymbols();

        // Load initial page (now async - data from Firebase)
        await this.loadDashboard();
        await this.updateStats();

        // Set current date display
        this.updateCurrentDate();

        console.log("App initialized successfully!");
  },
    
    // Update all currency symbols in UI
// ==================== CURRENCY ====================
async updateCurrencySymbols() {
    try {
        const settings = await Storage.getSettings();
        const symbol = settings.currencySymbol || '₹';
        
        // Update all currency symbol spans in modals and forms
        document.querySelectorAll('.currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
        
        // Also update Utils cached symbol
        Utils._cachedSymbol = symbol;
        
        console.log('Currency symbols updated to:', symbol);
    } catch (error) {
        console.error('Error updating currency symbols:', error);
    }
},

    // ==================== SPLASH SCREEN ====================
    initSplashScreen() {
        setTimeout(() => {
            const splash = document.getElementById("splash-screen");
            const app = document.getElementById("app");

            if (splash && app) {
                splash.classList.add("fade-out");
                setTimeout(async () => {
                    splash.style.display = "none";
                    app.classList.remove("hidden");

                    // Initialize charts after app is visible
                    if (typeof Charts !== "undefined") {
                        await Charts.init();
                    }
                }, 500);
            }
        }, 2000);
    },

    // ==================== NAVIGATION ====================
    initNavigation() {
        const navItems = document.querySelectorAll(".nav-item");
        const menuToggle = document.getElementById("menuToggle");
        const sidebar = document.getElementById("sidebar");

        // Nav item click handlers
        navItems.forEach((item) => {
            item.addEventListener("click", async () => {
                const page = item.dataset.page;
                await this.navigateTo(page);

                // Update active state
                navItems.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");

                // Close sidebar on mobile
                if (window.innerWidth <= 992 && sidebar) {
                    sidebar.classList.remove("active");
                }
            });
        });

        // Menu toggle for mobile
        if (menuToggle) {
            menuToggle.addEventListener("click", () => {
                if (sidebar) {
                    sidebar.classList.toggle("active");
                }
            });
        }

        // View all buttons
        document.querySelectorAll(".view-all-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                if (page) {
                    await this.navigateTo(page);
                    navItems.forEach((i) => i.classList.remove("active"));
                    const targetNav = document.querySelector(`[data-page="${page}"]`);
                    if (targetNav) targetNav.classList.add("active");
                }
            });
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener("click", (e) => {
            if (window.innerWidth <= 992 && sidebar && menuToggle) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove("active");
                }
            }
        });
    },

    async navigateTo(page) {
        this.currentPage = page;

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Show target page
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Load page-specific content
        switch (page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'transactions':
                await this.loadTransactions();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
            case 'budget':
                await this.loadBudgets();
                break;
            case 'calendar':
                await this.loadCalendar();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'borrow':
                await this.loadBorrowPage();
                break;
            case 'wishlist':
                await this.loadWishlistPage();
                break;
            case 'notes':
                await this.loadNotesPage();
                break;
        }

        // Scroll to top
        window.scrollTo(0, 0);
    },

    // ==================== THEME ====================
    async initTheme() {
        const themeToggle = document.getElementById("themeToggle");
        const settings = await Storage.getSettings();

        // Apply saved theme
        if (settings.theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
            }
        }

        // Theme toggle handler
        if (themeToggle) {
            themeToggle.addEventListener("click", async () => {
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";

                if (isDark) {
                    document.documentElement.removeAttribute("data-theme");
                    themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
                    await Storage.updateSettings({ theme: "light" });
                } else {
                    document.documentElement.setAttribute("data-theme", "dark");
                    themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
                    await Storage.updateSettings({ theme: "dark" });
                }

                // Update charts for theme change
                if (typeof Charts !== "undefined") {
                    setTimeout(async () => await Charts.updateAll(), 100);
                }
            });
        }
    },

    // ==================== MODALS ====================
    initModals() {
        // Transaction Modal
        const transactionModal = document.getElementById("transactionModal");
        const quickAddBtn = document.getElementById("quickAddBtn");
        const addTransactionBtn = document.getElementById("addTransactionBtn");
        const closeModal = document.getElementById("closeModal");
        const cancelTransaction = document.getElementById("cancelTransaction");

        // Open transaction modal
        [quickAddBtn, addTransactionBtn].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", async () => {
                    await this.openTransactionModal();
                });
            }
        });

        // Close transaction modal
        [closeModal, cancelTransaction].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    this.closeTransactionModal();
                });
            }
        });

        // Budget Modal
        const budgetModal = document.getElementById("budgetModal");
        const addBudgetBtn = document.getElementById("addBudgetBtn");
        const closeBudgetModal = document.getElementById("closeBudgetModal");
        const cancelBudget = document.getElementById("cancelBudget");

        if (addBudgetBtn) {
            addBudgetBtn.addEventListener("click", async () => {
                await this.openBudgetModal();
            });
        }

        [closeBudgetModal, cancelBudget].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    if (budgetModal) budgetModal.classList.remove("active");
                });
            }
        });

        // Category Modal
        const categoryModal = document.getElementById("categoryModal");
        const addCategoryBtn = document.getElementById("addCategoryBtn");
        const closeCategoryModal = document.getElementById("closeCategoryModal");
        const cancelCategory = document.getElementById("cancelCategory");

        if (addCategoryBtn) {
            addCategoryBtn.addEventListener("click", () => {
                this.openCategoryModal();
            });
        }

        [closeCategoryModal, cancelCategory].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    if (categoryModal) categoryModal.classList.remove("active");
                });
            }
        });

        // Close modals on outside click
        [transactionModal, budgetModal, categoryModal].forEach((modal) => {
            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        modal.classList.remove("active");
                    }
                });
            }
        });

        // Close modals on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".modal.active").forEach((modal) => {
                    modal.classList.remove("active");
                });
            }
        });
  },
    
    // ==================== TRANSACTION FORM ====================
    initTransactionForm() {
        const form = document.getElementById("transactionForm");
        const typeBtns = document.querySelectorAll(".type-btn");

        // Type button toggle
        typeBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                typeBtns.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });

        // Form submission
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveTransaction();
            });
        }
    },

    async openTransactionModal(editId = null) {
        const modal = document.getElementById("transactionModal");
        const form = document.getElementById("transactionForm");
        const modalTitle = document.getElementById("modalTitle");

        if (!modal || !form) return;

        // Reset form
        form.reset();
        this.editingTransaction = editId;

        // Set default date to today
        const dateInput = document.getElementById("transactionDate");
        if (dateInput) {
            dateInput.value = new Date().toISOString().split("T")[0];
        }

        // Reset type buttons
        document.querySelectorAll(".type-btn").forEach((btn) => {
            btn.classList.remove("active");
        });
        const expenseBtn = document.querySelector(".type-btn.expense");
        if (expenseBtn) expenseBtn.classList.add("active");

        // Load categories
        await this.loadCategoryOptions();

        if (editId) {
            // Edit mode
            if (modalTitle) modalTitle.textContent = "Edit Transaction";

            const transactions = await Storage.getTransactions();
            const transaction = transactions.find((t) => t.id === editId);

            if (transaction) {
                // Set type
                document.querySelectorAll(".type-btn").forEach((btn) => {
                    btn.classList.toggle("active", btn.dataset.type === transaction.type);
                });

                // Set values
                const amountInput = document.getElementById("transactionAmount");
                const descInput = document.getElementById("transactionDescription");
                const notesInput = document.getElementById("transactionNotes");
                const tagsInput = document.getElementById("transactionTags");

                if (amountInput) amountInput.value = transaction.amount;
                if (dateInput) dateInput.value = transaction.date;
                if (descInput) descInput.value = transaction.description;
                if (notesInput) notesInput.value = transaction.notes || "";
                if (tagsInput) tagsInput.value = transaction.tags || "";

                // Select category after options are loaded
                setTimeout(() => {
                    const categoryOption = document.querySelector(
                        `[data-id="${transaction.category}"]`
                    );
                    if (categoryOption) categoryOption.classList.add("selected");
                }, 100);
            }
        } else {
            // Add mode
            if (modalTitle) modalTitle.textContent = "Add Transaction";
        }

        modal.classList.add("active");
    },

    closeTransactionModal() {
        const modal = document.getElementById("transactionModal");
        if (modal) {
            modal.classList.remove("active");
            this.editingTransaction = null;
        }
    },

    async loadCategoryOptions() {
        const grid = document.getElementById("categoryGrid");
        if (!grid) return;

        const categories = await Storage.getCategories();

        if (!Array.isArray(categories)) {
            console.warn('loadCategoryOptions: categories is not an array');
            return;
        }

        grid.innerHTML = categories
            .map(
                (cat) => `
                <div class="category-option" data-id="${cat.id}">
                    <i class="fas ${cat.icon}" style="color: ${cat.color}"></i>
                    <span>${cat.name}</span>
                </div>
            `
            )
            .join("");

        // Add click handlers
        grid.querySelectorAll(".category-option").forEach((option) => {
            option.addEventListener("click", () => {
                grid.querySelectorAll(".category-option").forEach((o) => o.classList.remove("selected"));
                option.classList.add("selected");
            });
        });
    },

    async saveTransaction() {
        const type = document.querySelector('.type-btn.active')?.dataset.type;
        const amount = document.getElementById('transactionAmount')?.value;
        const date = document.getElementById('transactionDate')?.value;
        const description = document.getElementById('transactionDescription')?.value;
        const category = document.querySelector('.category-option.selected')?.dataset.id;
        const notes = document.getElementById('transactionNotes')?.value || '';
        const tags = document.getElementById('transactionTags')?.value || '';

        // Validation
        if (!type || !amount || !date || !description || !category) {
            Utils.showToast('Please fill in all required fields', 'error');
            return;
        }

        const transaction = {
            type,
            amount: parseFloat(amount),
            date,
            description,
            category,
            notes,
            tags
        };

        try {
            if (this.editingTransaction) {
                await Storage.updateTransaction(this.editingTransaction, transaction);
                Utils.showToast('Transaction updated successfully!', 'success');
            } else {
                await Storage.addTransaction(transaction);
                Utils.showToast('Transaction added successfully!', 'success');

                // Check budget alerts
                await this.checkBudgetAlerts(category, parseFloat(amount));
            }

            this.closeTransactionModal();
            await this.refreshCurrentPage();
        } catch (error) {
            console.error('Error saving transaction:', error);
            Utils.showToast('Failed to save transaction', 'error');
        }
    },

    async checkBudgetAlerts(category, amount) {
        try {
            const budgets = await Storage.getBudgets();
            const budget = budgets.find((b) => b.category === category);

            if (budget) {
                const transactions = await Storage.getTransactions();
                const { start, end } = Utils.getDateRange("month");
                const monthTransactions = Utils.getTransactionsByDateRange(
                    transactions,
                    start,
                    end
                ).filter((t) => t.type === "expense" && t.category === category);

                const totalSpent = monthTransactions.reduce(
                    (sum, t) => sum + parseFloat(t.amount),
                    0
                );
                const percentage = (totalSpent / budget.amount) * 100;

                if (percentage >= 100) {
                    Utils.showToast(`Budget exceeded for ${category}!`, "error");
                    await Storage.addNotification({
                        type: "budget",
                        icon: "fa-exclamation-circle",
                        title: "Budget Exceeded!",
                        message: `You've exceeded your ${category} budget.`,
                    });
                } else if (percentage >= 80) {
                    Utils.showToast(
                        `Warning: ${percentage.toFixed(0)}% of ${category} budget used`,
                        "warning"
                    );
                }
            }
        } catch (error) {
            console.error('checkBudgetAlerts error:', error);
        }
    },

    async editTransaction(id) {
        await this.openTransactionModal(id);
    },

    async deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                await Storage.deleteTransaction(id);
                Utils.showToast('Transaction deleted', 'success');
                await this.refreshCurrentPage();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                Utils.showToast('Failed to delete transaction', 'error');
            }
        }
    },

    // ==================== BUDGET FORM ====================
    initBudgetForm() {
        const form = document.getElementById("budgetForm");

        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveBudget();
            });
        }
    },

    async openBudgetModal() {
        const modal = document.getElementById("budgetModal");
        const form = document.getElementById("budgetForm");

        if (!modal || !form) return;

        form.reset();
        await this.loadBudgetCategories();
        modal.classList.add("active");
    },

    async loadBudgetCategories() {
        const select = document.getElementById("budgetCategory");
        if (!select) return;

        const categories = await Storage.getCategories();
        const existingBudgets = await Storage.getBudgets();
        
        if (!Array.isArray(categories) || !Array.isArray(existingBudgets)) return;
        
        const usedCategories = existingBudgets.map((b) => b.category);

        // Filter out categories that already have budgets
        const availableCategories = categories.filter(
            (c) => !usedCategories.includes(c.id)
        );

        select.innerHTML = availableCategories
            .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
            .join("");

        if (availableCategories.length === 0) {
            select.innerHTML = '<option value="">All categories have budgets</option>';
        }
    },

    async saveBudget() {
        const category = document.getElementById("budgetCategory")?.value;
        const amount = document.getElementById("budgetAmount")?.value;
        const period = document.getElementById("budgetPeriod")?.value;

        if (!category || !amount) {
            Utils.showToast("Please fill in all fields", "error");
            return;
        }

        try {
            await Storage.addBudget({
                category,
                amount: parseFloat(amount),
                period,
            });

            Utils.showToast("Budget added successfully!", "success");

            const modal = document.getElementById("budgetModal");
            if (modal) modal.classList.remove("active");

            const form = document.getElementById("budgetForm");
            if (form) form.reset();

            await this.loadBudgets();
        } catch (error) {
            console.error('saveBudget error:', error);
            Utils.showToast("Failed to save budget", "error");
        }
    },

    async deleteBudget(id) {
        if (confirm("Are you sure you want to delete this budget?")) {
            try {
                await Storage.deleteBudget(id);
                Utils.showToast("Budget deleted", "success");
                await this.loadBudgets();
            } catch (error) {
                console.error('deleteBudget error:', error);
                Utils.showToast("Failed to delete budget", "error");
            }
        }
    },

    // ==================== CATEGORY FORM ====================
    initCategoryForm() {
        const form = document.getElementById("categoryForm");

        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveCategory();
            });
        }
    },

    openCategoryModal() {
        const modal = document.getElementById("categoryModal");
        const form = document.getElementById("categoryForm");

        if (!modal || !form) return;

        form.reset();
        this.loadIconOptions();
        this.loadColorOptions();
        modal.classList.add("active");
    },

    loadIconOptions() {
        const grid = document.getElementById("iconGrid");
        if (!grid) return;

        const icons = [
            "fa-utensils", "fa-car", "fa-shopping-bag", "fa-file-invoice",
            "fa-gamepad", "fa-heartbeat", "fa-graduation-cap", "fa-plane",
            "fa-home", "fa-mobile-alt", "fa-coffee", "fa-dumbbell",
            "fa-book", "fa-music", "fa-film", "fa-paw",
            "fa-tshirt", "fa-gift", "fa-tools", "fa-briefcase",
            "fa-baby", "fa-pills", "fa-gas-pump", "fa-wifi",
        ];

        grid.innerHTML = icons
            .map(
                (icon) => `
                <div class="icon-option" data-icon="${icon}">
                    <i class="fas ${icon}"></i>
                </div>
            `
            )
            .join("");

        grid.querySelectorAll(".icon-option").forEach((option) => {
            option.addEventListener("click", () => {
                grid.querySelectorAll(".icon-option").forEach((o) => o.classList.remove("selected"));
                option.classList.add("selected");
            });
        });
    },

    loadColorOptions() {
        const grid = document.getElementById("colorGrid");
        if (!grid) return;

        const colors = [
            "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
            "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
            "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
            "#ec4899", "#f43f5e", "#64748b", "#78716c", "#000000",
        ];

        grid.innerHTML = colors
            .map(
                (color) => `
                <div class="color-option" data-color="${color}" style="background: ${color}"></div>
            `
            )
            .join("");

        grid.querySelectorAll(".color-option").forEach((option) => {
            option.addEventListener("click", () => {
                grid.querySelectorAll(".color-option").forEach((o) => o.classList.remove("selected"));
                option.classList.add("selected");
            });
        });
    },

    async saveCategory() {
        const name = document.getElementById("categoryName")?.value;
        const icon = document.querySelector(".icon-option.selected")?.dataset.icon;
        const color = document.querySelector(".color-option.selected")?.dataset.color;

        if (!name || !icon || !color) {
            Utils.showToast("Please fill in all fields", "error");
            return;
        }

        try {
            await Storage.addCategory({ name, icon, color });
            Utils.showToast("Category added successfully!", "success");

            const modal = document.getElementById("categoryModal");
            if (modal) modal.classList.remove("active");

            const form = document.getElementById("categoryForm");
            if (form) form.reset();

            await this.loadSettings();
        } catch (error) {
            console.error('saveCategory error:', error);
            Utils.showToast("Failed to save category", "error");
        }
    },

    async deleteCategory(id) {
        if (confirm("Delete this category? Transactions using this category will not be deleted.")) {
            try {
                await Storage.deleteCategory(id);
                Utils.showToast("Category deleted", "success");
                await this.loadSettings();
            } catch (error) {
                console.error('deleteCategory error:', error);
                Utils.showToast("Failed to delete category", "error");
            }
        }
  },
    
    // ==================== DASHBOARD ====================
    async loadDashboard() {
        await this.updateStats();
        await this.loadRecentTransactions();
        await this.loadDashboardOverview();
        this.updateCurrentDate();

        // Update charts
        if (typeof Charts !== 'undefined') {
            await Charts.initSpendingChart();
            await Charts.initCategoryChart();
            await Charts.initSparklines();
        }
    },

    updateCurrentDate() {
        const dateDisplay = document.getElementById("currentDate");
        if (dateDisplay) {
            dateDisplay.textContent = Utils.formatDate(new Date(), "long");
        }
    },

    async updateStats() {
        try {
            const transactions = await Storage.getTransactions();
            const { start, end } = Utils.getDateRange('month');
            const monthTransactions = Utils.getTransactionsByDateRange(transactions, start, end);
            const totals = Utils.calculateTotals(monthTransactions);

            const settings = await Storage.getSettings();

            // Update cached settings for Utils
            await Utils.updateCachedSettings();

            // Update stat cards with animation
            const elements = {
                totalIncome: document.getElementById('totalIncome'),
                totalExpense: document.getElementById('totalExpense'),
                totalBalance: document.getElementById('totalBalance'),
                totalSavings: document.getElementById('totalSavings')
            };

            if (elements.totalIncome) {
                Utils.animateCounter(elements.totalIncome, totals.income);
            }
            if (elements.totalExpense) {
                Utils.animateCounter(elements.totalExpense, totals.expense);
            }
            if (elements.totalBalance) {
                Utils.animateCounter(elements.totalBalance, totals.balance);
            }
            if (elements.totalSavings) {
                Utils.animateCounter(elements.totalSavings, Math.max(0, totals.balance));
            }

            // Update user name
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = settings.userName || 'User';
            }
        } catch (error) {
            console.error('updateStats error:', error);
        }
    },

    async loadRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        try {
            const transactions = await Storage.getTransactions();
            const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 5) : [];
            const categories = await Storage.getCategories();

            if (recentTransactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions yet</p>
                        <p class="empty-subtitle">Add your first transaction to get started!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = recentTransactions.map((t, index) => {
                const category = Array.isArray(categories) ? categories.find(c => c.id === t.category) : null;
                return `
                    <div class="transaction-item animate-card" style="animation-delay: ${index * 0.1}s">
                        <div class="transaction-icon" style="background: ${category?.color || '#667eea'}">
                            <i class="fas ${category?.icon || 'fa-receipt'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${t.description}</h4>
                            <p>${category?.name || t.category} • ${Utils.formatDate(t.date)}</p>
                        </div>
                        <div class="transaction-amount ${t.type}">
                            ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('loadRecentTransactions error:', error);
            container.innerHTML = '<p class="error-message">Error loading transactions</p>';
        }
    },

    async loadDashboardOverview() {
        try {
            // Borrow Overview
            const borrows = await Storage.getBorrows();
            const activeBorrows = Array.isArray(borrows) ? borrows.filter(b => b.status !== 'completed') : [];

            const givenTotal = activeBorrows
                .filter(b => b.type === 'given')
                .reduce((sum, b) => sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)), 0);
            const takenTotal = activeBorrows
                .filter(b => b.type === 'taken')
                .reduce((sum, b) => sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)), 0);

            const dashGiven = document.getElementById('dashGiven');
            const dashTaken = document.getElementById('dashTaken');

            if (dashGiven) dashGiven.textContent = Utils.formatCurrency(givenTotal);
            if (dashTaken) dashTaken.textContent = Utils.formatCurrency(takenTotal);

            // Check for overdue
            const today = new Date().toISOString().split('T')[0];
            const overdue = activeBorrows.filter(b => b.dueDate && b.dueDate < today);
            const borrowAlert = document.getElementById('borrowAlert');
            const borrowAlertText = document.getElementById('borrowAlertText');

            if (borrowAlert && borrowAlertText) {
                if (overdue.length > 0) {
                    borrowAlert.style.display = 'flex';
                    borrowAlertText.textContent = `${overdue.length} overdue payment${overdue.length > 1 ? 's' : ''}!`;
                } else {
                    borrowAlert.style.display = 'none';
                }
            }

            // Wishlist Overview
            const wishlist = await Storage.getWishlist();
            const activeWishlist = Array.isArray(wishlist) ? wishlist.filter(w => !w.purchased) : [];

            const wishlistCount = document.getElementById('dashWishlistCount');
            const wishlistTotal = document.getElementById('dashWishlistTotal');

            if (wishlistCount) wishlistCount.textContent = activeWishlist.length;
            if (wishlistTotal) {
                wishlistTotal.textContent = Utils.formatCurrency(
                    activeWishlist.reduce((sum, w) => sum + parseFloat(w.price), 0)
                );
            }

            // Top priority wishlist item
            const highPriority = activeWishlist.find(w => w.priority === 'high');
            const topWishlistItem = document.getElementById('topWishlistItem');

            if (topWishlistItem) {
                if (highPriority) {
                    topWishlistItem.style.display = 'flex';
                    const itemName = topWishlistItem.querySelector('.item-name');
                    if (itemName) itemName.textContent = highPriority.name;
                } else {
                    topWishlistItem.style.display = 'none';
                }
            }

            // Notes count
            const notes = await Storage.getNotes();
            const dashNotesCount = document.getElementById('dashNotesCount');
            if (dashNotesCount) {
                dashNotesCount.textContent = Array.isArray(notes) ? notes.length : 0;
            }
        } catch (error) {
            console.error('loadDashboardOverview error:', error);
        }
    },

    // ==================== TRANSACTIONS PAGE ====================
    async loadTransactions(page = 1) {
        try {
            const transactions = await Storage.getTransactions();
            const categories = await Storage.getCategories();
            
            if (!Array.isArray(transactions)) {
                console.warn('loadTransactions: transactions is not an array');
                return;
            }

            const perPage = 10;
            const totalPages = Math.ceil(transactions.length / perPage);
            const start = (page - 1) * perPage;
            const pageTransactions = transactions.slice(start, start + perPage);

            // Load filter categories
            const filterCategory = document.getElementById('filterCategory');
            if (filterCategory && filterCategory.options.length <= 1 && Array.isArray(categories)) {
                filterCategory.innerHTML = '<option value="all">All Categories</option>' +
                    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }

            const tbody = document.getElementById('transactionsTableBody');
            if (!tbody) return;

            if (transactions.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-cell">
                            <div class="empty-state">
                                <i class="fas fa-receipt"></i>
                                <p>No transactions found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = pageTransactions.map(t => {
                const category = Array.isArray(categories) ? categories.find(c => c.id === t.category) : null;
                return `
                    <tr class="animate-row">
                        <td>${Utils.formatDate(t.date)}</td>
                        <td>
                            <div class="transaction-desc">
                                <strong>${t.description}</strong>
                                ${t.notes ? `<small>${t.notes}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="category-badge" style="background: ${category?.color}20; color: ${category?.color}">
                                <i class="fas ${category?.icon}"></i>
                                ${category?.name || t.category}
                            </span>
                        </td>
                        <td class="amount ${t.type}">
                            ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                        </td>
                        <td class="actions">
                            <button class="action-btn edit" onclick="App.editTransaction('${t.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="App.deleteTransaction('${t.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render pagination
            this.renderPagination(page, totalPages);
        } catch (error) {
            console.error('loadTransactions error:', error);
        }
    },

    renderPagination(current, total) {
        const container = document.getElementById("pagination");
        if (!container) return;

        if (total <= 1) {
            container.innerHTML = "";
            return;
        }

        let html = "";

        // Previous button
        if (current > 1) {
            html += `<button onclick="App.loadTransactions(${current - 1})"><i class="fas fa-chevron-left"></i></button>`;
        }

        // Page numbers
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
                html += `<button class="${i === current ? "active" : ""}" onclick="App.loadTransactions(${i})">${i}</button>`;
            } else if (i === current - 3 || i === current + 3) {
                html += '<span class="pagination-dots">...</span>';
            }
        }

        // Next button
        if (current < total) {
            html += `<button onclick="App.loadTransactions(${current + 1})"><i class="fas fa-chevron-right"></i></button>`;
        }

        container.innerHTML = html;
    },

    // ==================== FILTERS ====================
    initFilters() {
        const applyFilters = document.getElementById("applyFilters");
        const clearFilters = document.getElementById("clearFilters");

        if (applyFilters) {
            applyFilters.addEventListener("click", async () => {
                await this.applyTransactionFilters();
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener("click", async () => {
                await this.clearTransactionFilters();
            });
        }
    },

    async applyTransactionFilters() {
        try {
            const type = document.getElementById("filterType")?.value || "all";
            const category = document.getElementById("filterCategory")?.value || "all";
            const dateFrom = document.getElementById("filterDateFrom")?.value;
            const dateTo = document.getElementById("filterDateTo")?.value;

            let transactions = await Storage.getTransactions();
            
            if (!Array.isArray(transactions)) {
                transactions = [];
            }

            if (type !== "all") {
                transactions = transactions.filter((t) => t.type === type);
            }

            if (category !== "all") {
                transactions = transactions.filter((t) => t.category === category);
            }

            if (dateFrom) {
                transactions = transactions.filter((t) => t.date >= dateFrom);
            }

            if (dateTo) {
                transactions = transactions.filter((t) => t.date <= dateTo);
            }

            await this.renderFilteredTransactions(transactions);
        } catch (error) {
            console.error('applyTransactionFilters error:', error);
        }
    },

    async clearTransactionFilters() {
        const filterType = document.getElementById("filterType");
        const filterCategory = document.getElementById("filterCategory");
        const filterDateFrom = document.getElementById("filterDateFrom");
        const filterDateTo = document.getElementById("filterDateTo");

        if (filterType) filterType.value = "all";
        if (filterCategory) filterCategory.value = "all";
        if (filterDateFrom) filterDateFrom.value = "";
        if (filterDateTo) filterDateTo.value = "";

        await this.loadTransactions();
    },

    async renderFilteredTransactions(transactions) {
        const categories = await Storage.getCategories();
        const tbody = document.getElementById("transactionsTableBody");

        if (!tbody) return;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-cell">
                        <div class="empty-state">
                            <i class="fas fa-filter"></i>
                            <p>No transactions match your filters</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions
            .map((t) => {
                const category = Array.isArray(categories) ? categories.find((c) => c.id === t.category) : null;
                return `
                    <tr>
                        <td>${Utils.formatDate(t.date)}</td>
                        <td>${t.description}</td>
                        <td>
                            <span class="category-badge" style="background: ${category?.color}20; color: ${category?.color}">
                                <i class="fas ${category?.icon}"></i>
                                ${category?.name || t.category}
                            </span>
                        </td>
                        <td class="amount ${t.type}">
                            ${t.type === "income" ? "+" : "-"}${Utils.formatCurrency(t.amount)}
                        </td>
                        <td class="actions">
                            <button class="action-btn edit" onclick="App.editTransaction('${t.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="App.deleteTransaction('${t.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        // Hide pagination for filtered results
        const pagination = document.getElementById("pagination");
        if (pagination) pagination.innerHTML = "";
    },

    // ==================== ANALYTICS PAGE ====================
    async loadAnalytics() {
        try {
            if (typeof Charts !== "undefined") {
                await Charts.initTrendChart();
                await Charts.initCategoryPieChart();
                await Charts.initDailyPatternChart();
                await Charts.initMonthlyComparisonChart();
            }

            await this.loadTopCategories();
            await this.loadInsights();

            // Period selector handlers
            document.querySelectorAll(".period-btn").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"));
                    btn.classList.add("active");

                    if (typeof Charts !== "undefined") {
                        await Charts.updateAll();
                    }
                });
            });
        } catch (error) {
            console.error('loadAnalytics error:', error);
        }
    },

    async loadTopCategories() {
        const container = document.getElementById("topCategories");
        if (!container) return;

        try {
            const allTransactions = await Storage.getTransactions();
            const transactions = Array.isArray(allTransactions) 
                ? allTransactions.filter((t) => t.type === "expense") 
                : [];
            const categories = await Storage.getCategories();
            const grouped = Utils.groupByCategory(transactions);
            const totalExpense = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            if (totalExpense === 0) {
                container.innerHTML = '<p class="empty-message">No expense data yet</p>';
                return;
            }

            const sortedCategories = Object.entries(grouped)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5);

            container.innerHTML = sortedCategories
                .map(([catId, info]) => {
                    const category = Array.isArray(categories) ? categories.find((c) => c.id === catId) : null;
                    const percentage = ((info.total / totalExpense) * 100).toFixed(0);

                    return `
                        <div class="category-progress animate-card">
                            <div class="category-progress-header">
                                <span>
                                    <i class="fas ${category?.icon}" style="background: ${category?.color}; padding: 8px; border-radius: 8px; color: white;"></i>
                                    ${category?.name || catId}
                                </span>
                                <span>${Utils.formatCurrency(info.total)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%; background: ${category?.color}"></div>
                            </div>
                        </div>
                    `;
                })
                .join("");
        } catch (error) {
            console.error('loadTopCategories error:', error);
            container.innerHTML = '<p class="empty-message">Error loading data</p>';
        }
    },

    async loadInsights() {
        const container = document.getElementById("insightsGrid");
        if (!container) return;

        try {
            const transactions = await Storage.getTransactions();
            const budgets = await Storage.getBudgets();
            const insights = await Utils.generateInsights(transactions, budgets);

            if (!Array.isArray(insights) || insights.length === 0) {
                container.innerHTML = `
                    <div class="insight-card neutral">
                        <i class="fas fa-info-circle"></i>
                        <div class="insight-content">
                            <h4>No insights yet</h4>
                            <p>Add more transactions to get personalized financial insights.</p>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = insights
                .map(
                    (insight) => `
                    <div class="insight-card ${insight.type} animate-card">
                        <i class="fas ${insight.icon}"></i>
                        <div class="insight-content">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                        </div>
                    </div>
                `
                )
                .join("");
        } catch (error) {
            console.error('loadInsights error:', error);
            container.innerHTML = '<p class="empty-message">Error loading insights</p>';
        }
    },

    // ==================== BUDGET PAGE ====================
    async loadBudgets() {
        try {
            const budgets = await Storage.getBudgets();
            const categories = await Storage.getCategories();
            const transactions = await Storage.getTransactions();
            
            if (!Array.isArray(budgets) || !Array.isArray(transactions)) return;

            const { start, end } = Utils.getDateRange("month");
            const monthTransactions = Utils.getTransactionsByDateRange(transactions, start, end);
            const grouped = Utils.groupByCategory(
                monthTransactions.filter((t) => t.type === "expense")
            );

            let totalBudget = 0;
            let totalSpent = 0;

            const budgetGrid = document.getElementById("budgetGrid");
            if (!budgetGrid) return;

            if (budgets.length === 0) {
                budgetGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-bullseye"></i>
                        <p>No budgets set</p>
                        <p class="empty-subtitle">Create budgets to track your spending limits</p>
                        <button class="add-btn" onclick="App.openBudgetModal()">
                            <i class="fas fa-plus"></i> Create Budget
                        </button>
                    </div>
                `;

                // Update overview to zeros
                this.updateBudgetOverview(0, 0);
                return;
            }

            const budgetCards = budgets
                .map((budget) => {
                    const category = Array.isArray(categories) ? categories.find((c) => c.id === budget.category) : null;
                    const spent = grouped[budget.category]?.total || 0;
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const remaining = Math.max(budget.amount - spent, 0);

                    totalBudget += budget.amount;
                    totalSpent += Math.min(spent, budget.amount);

                    let status = "safe";
                    let statusText = "On Track";
                    let statusIcon = "fa-check-circle";

                    if (percentage >= 100) {
                        status = "exceeded";
                        statusText = "Budget Exceeded!";
                        statusIcon = "fa-exclamation-circle";
                    } else if (percentage >= 80) {
                        status = "warning";
                        statusText = "Almost at limit";
                        statusIcon = "fa-exclamation-triangle";
                    }

                    return `
                        <div class="budget-card animate-card">
                            <div class="budget-card-header">
                                <div class="budget-category">
                                    <i class="fas ${category?.icon}" style="background: ${category?.color}"></i>
                                    <div>
                                        <h4>${category?.name || budget.category}</h4>
                                        <span class="budget-period">${budget.period}</span>
                                    </div>
                                </div>
                                <button class="action-btn delete" onclick="App.deleteBudget('${budget.id}')" title="Delete Budget">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="budget-amounts">
                                <span>Spent: <strong>${Utils.formatCurrency(spent)}</strong></span>
                                <span>Budget: <strong>${Utils.formatCurrency(budget.amount)}</strong></span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%; background: ${
                                    status === "exceeded"
                                        ? "var(--danger)"
                                        : status === "warning"
                                            ? "var(--warning)"
                                            : "var(--success)"
                                }"></div>
                            </div>
                            <div class="budget-footer">
                                <span class="budget-remaining">Remaining: ${Utils.formatCurrency(remaining)}</span>
                                <span class="budget-status ${status}">
                                    <i class="fas ${statusIcon}"></i>
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                    `;
                })
                .join("");

            budgetGrid.innerHTML = budgetCards;
            this.updateBudgetOverview(totalBudget, totalSpent);
        } catch (error) {
            console.error('loadBudgets error:', error);
        }
    },

    updateBudgetOverview(totalBudget, totalSpent) {
        const totalBudgetEl = document.getElementById("totalBudget");
        const totalSpentEl = document.getElementById("totalSpent");
        const totalRemainingEl = document.getElementById("totalRemaining");
        const overallProgress = document.getElementById("overallProgress");
        const overallPercentage = document.getElementById("overallPercentage");

        if (totalBudgetEl) totalBudgetEl.textContent = Utils.formatCurrency(totalBudget);
        if (totalSpentEl) totalSpentEl.textContent = Utils.formatCurrency(totalSpent);
        if (totalRemainingEl) totalRemainingEl.textContent = Utils.formatCurrency(Math.max(totalBudget - totalSpent, 0));

        const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
        if (overallProgress) overallProgress.style.width = `${percentage}%`;
        if (overallPercentage) overallPercentage.textContent = `${percentage.toFixed(0)}%`;
    },

    // ==================== CALENDAR PAGE ====================
    initCalendar() {
        const prevBtn = document.getElementById("prevMonth");
        const nextBtn = document.getElementById("nextMonth");

        if (prevBtn) {
            prevBtn.addEventListener("click", async () => {
                this.currentCalendarMonth.setMonth(this.currentCalendarMonth.getMonth() - 1);
                await this.loadCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", async () => {
                this.currentCalendarMonth.setMonth(this.currentCalendarMonth.getMonth() + 1);
                await this.loadCalendar();
            });
        }
    },

    async loadCalendar() {
        try {
            const year = this.currentCalendarMonth.getFullYear();
            const month = this.currentCalendarMonth.getMonth();
            const transactions = await Storage.getTransactions();

            // Update month display
            const monthDisplay = document.getElementById("currentMonth");
            if (monthDisplay) {
                monthDisplay.textContent = new Date(year, month).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                });
            }

            const firstDay = Utils.getFirstDayOfMonth(year, month);
            const daysInMonth = Utils.getDaysInMonth(year, month);
            const daysInPrevMonth = Utils.getDaysInMonth(year, month - 1);

            const grid = document.getElementById("calendarGrid");
            if (!grid) return;

            grid.innerHTML = "";

            // Previous month days
            for (let i = firstDay - 1; i >= 0; i--) {
                const day = daysInPrevMonth - i;
                grid.innerHTML += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
            }

            // Current month days
            const today = new Date();
            const transactionsArray = Array.isArray(transactions) ? transactions : [];
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTransactions = transactionsArray.filter((t) => t.date === dateStr);
                const hasIncome = dayTransactions.some((t) => t.type === "income");
                const hasExpense = dayTransactions.some((t) => t.type === "expense");
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                let indicators = "";
                if (hasIncome || hasExpense) {
                    indicators = `<div class="day-indicator">
                        ${hasIncome ? '<span class="dot income"></span>' : ""}
                        ${hasExpense ? '<span class="dot expense"></span>' : ""}
                    </div>`;
                }

                grid.innerHTML += `
                    <div class="calendar-day ${isToday ? "today" : ""}" data-date="${dateStr}">
                        <span class="day-number">${day}</span>
                        ${indicators}
                    </div>
                `;
            }

            // Next month days
            const totalCells = 42;
            const remainingCells = totalCells - (firstDay + daysInMonth);
            for (let day = 1; day <= remainingCells; day++) {
                grid.innerHTML += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
            }

            // Add click handlers
            grid.querySelectorAll(".calendar-day:not(.other-month)").forEach((dayEl) => {
                dayEl.addEventListener("click", async () => {
                    grid.querySelectorAll(".calendar-day").forEach((d) => d.classList.remove("selected"));
                    dayEl.classList.add("selected");
                    await this.loadDayTransactions(dayEl.dataset.date);
                });
            });

            // Load today's transactions by default
            const todayStr = today.toISOString().split("T")[0];
            await this.loadDayTransactions(todayStr);
        } catch (error) {
            console.error('loadCalendar error:', error);
        }
    },

    async loadDayTransactions(date) {
        const container = document.getElementById("dayDetails");
        const transactionsContainer = document.getElementById("dayTransactions");

        if (!container || !transactionsContainer) return;

        try {
            const allTransactions = await Storage.getTransactions();
            const transactions = Array.isArray(allTransactions) 
                ? allTransactions.filter((t) => t.date === date) 
                : [];
            const categories = await Storage.getCategories();

            const headerEl = container.querySelector("h3");
            if (headerEl) {
                headerEl.textContent = Utils.formatDate(date, "long");
            }

            if (transactions.length === 0) {
                transactionsContainer.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-calendar-day"></i>
                        <p>No transactions on this day</p>
                    </div>
                `;
                return;
            }

            const totals = Utils.calculateTotals(transactions);

            transactionsContainer.innerHTML = `
                <div class="day-summary">
                    <span class="income">+${Utils.formatCurrency(totals.income)}</span>
                    <span class="expense">-${Utils.formatCurrency(totals.expense)}</span>
                </div>
                ${transactions
                    .map((t) => {
                        const category = Array.isArray(categories) ? categories.find((c) => c.id === t.category) : null;
                        return `
                            <div class="transaction-item small">
                                <div class="transaction-icon small" style="background: ${category?.color}">
                                    <i class="fas ${category?.icon}"></i>
                                </div>
                                <div class="transaction-details">
                                    <h4>${t.description}</h4>
                                    <p>${category?.name}</p>
                                </div>
                                <div class="transaction-amount ${t.type}">
                                    ${t.type === "income" ? "+" : "-"}${Utils.formatCurrency(t.amount)}
                                </div>
                            </div>
                        `;
                    })
                    .join("")}
            `;
        } catch (error) {
            console.error('loadDayTransactions error:', error);
        }
  },
    
  // ==================== SETTINGS PAGE ====================
    initSettings() {
        // Save profile
        const saveProfileBtn = document.getElementById("saveProfile");
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener("click", async () => {
                await this.saveProfile();
            });
        }

        // Currency change
        // Currency change
      const currencySelect = document.getElementById("settingsCurrency");
      if (currencySelect) {
          currencySelect.addEventListener("change", async (e) => {
              const currencySymbols = {
                  'USD': '$',
                  'EUR': '€',
                  'GBP': '£',
                  'INR': '₹',
                  'JPY': '¥'
              };
              
              const currency = e.target.value;
              const symbol = currencySymbols[currency] || '$';
              
              await Storage.updateSettings({ 
                  currency: currency,
                  currencySymbol: symbol 
              });
              await Utils.updateCachedSettings();
              await this.updateCurrencySymbols();  // ADD THIS
              
              Utils.showToast("Currency updated!", "success");
              await this.refreshCurrentPage();
          });
      }
        // Notification toggles
        ["budgetAlerts", "dailyReminders", "weeklyReports"].forEach((id) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener("change", async (e) => {
                    await Storage.updateSettings({ [id]: e.target.checked });
                    Utils.showToast("Setting updated!", "success");
                });
            }
        });

        // Data management
        const exportBtn = document.getElementById("exportData");
        if (exportBtn) {
            exportBtn.addEventListener("click", async () => {
                try {
                    const data = await Storage.exportData();
                    Utils.downloadFile(
                        JSON.stringify(data, null, 2),
                        `expenseflow_backup_${new Date().toISOString().split("T")[0]}.json`
                    );
                    Utils.showToast("Data exported successfully!", "success");
                } catch (error) {
                    console.error('Export error:', error);
                    Utils.showToast("Export failed", "error");
                }
            });
        }

        const importBtn = document.getElementById("importData");
        const importFile = document.getElementById("importFile");
        if (importBtn && importFile) {
            importBtn.addEventListener("click", () => {
                importFile.click();
            });

            importFile.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            await Storage.importData(data);
                            Utils.showToast("Data imported successfully!", "success");
                            await this.refreshCurrentPage();
                        } catch (error) {
                            Utils.showToast("Invalid file format", "error");
                        }
                    };
                    reader.readAsText(file);
                }
                importFile.value = "";
            });
        }

        const clearBtn = document.getElementById("clearData");
        if (clearBtn) {
            clearBtn.addEventListener("click", async () => {
                if (confirm("Are you sure you want to clear ALL data? This cannot be undone!")) {
                    if (confirm("This will delete all transactions, budgets, notes, and settings. Continue?")) {
                        try {
                            await Storage.clearAllData();
                            Utils.showToast("All data cleared", "success");
                            location.reload();
                        } catch (error) {
                            console.error('Clear data error:', error);
                            Utils.showToast("Failed to clear data", "error");
                        }
                    }
                }
            });
        }
    },

    async saveProfile() {
        const name = document.getElementById("settingsName")?.value;
        const email = document.getElementById("settingsEmail")?.value;

        try {
            await Storage.updateSettings({ userName: name, email });
            Utils.showToast("Profile saved!", "success");
            await this.updateStats();
        } catch (error) {
            console.error('saveProfile error:', error);
            Utils.showToast("Failed to save profile", "error");
        }
    },

    async loadSettings() {
        try {
            const settings = await Storage.getSettings();
            const categories = await Storage.getCategories();

            // Load profile
            const nameInput = document.getElementById("settingsName");
            const emailInput = document.getElementById("settingsEmail");
            const currencySelect = document.getElementById("settingsCurrency");

            if (nameInput) nameInput.value = settings.userName || "";
            if (emailInput) emailInput.value = settings.email || "";
            if (currencySelect) currencySelect.value = settings.currency || "USD";

            // Load toggles
            const budgetAlerts = document.getElementById("budgetAlerts");
            const dailyReminders = document.getElementById("dailyReminders");
            const weeklyReports = document.getElementById("weeklyReports");

            if (budgetAlerts) budgetAlerts.checked = settings.budgetAlerts !== false;
            if (dailyReminders) dailyReminders.checked = settings.dailyReminders === true;
            if (weeklyReports) weeklyReports.checked = settings.weeklyReports !== false;

            // Load categories list
            const categoriesList = document.getElementById("categoriesList");
            if (categoriesList && Array.isArray(categories)) {
                categoriesList.innerHTML = categories
                    .map(
                        (cat) => `
                        <div class="category-item">
                            <span>
                                <i class="fas ${cat.icon}" style="background: ${cat.color}"></i>
                                ${cat.name}
                            </span>
                            <button class="action-btn delete small" onclick="App.deleteCategory('${cat.id}')" title="Delete">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `
                    )
                    .join("");
            }
        } catch (error) {
            console.error('loadSettings error:', error);
        }
    },

    // ==================== SEARCH ====================
    initSearch() {
        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                Utils.debounce(async (e) => {
                    const query = e.target.value.toLowerCase().trim();

                    if (query.length < 2) return;

                    try {
                        const allTransactions = await Storage.getTransactions();
                        const transactions = Array.isArray(allTransactions) ? allTransactions : [];
                        
                        const results = transactions.filter(
                            (t) =>
                                t.description.toLowerCase().includes(query) ||
                                t.category.toLowerCase().includes(query) ||
                                (t.notes && t.notes.toLowerCase().includes(query)) ||
                                (t.tags && t.tags.toLowerCase().includes(query))
                        );

                        if (results.length > 0) {
                            await this.navigateTo("transactions");
                            await this.renderFilteredTransactions(results);
                            Utils.showToast(`Found ${results.length} transaction(s)`, "info");
                        } else {
                            Utils.showToast("No transactions found", "info");
                        }
                    } catch (error) {
                        console.error('Search error:', error);
                    }
                }, 500)
            );

            // Clear search on page change
            searchInput.addEventListener("focus", () => {
                searchInput.select();
            });
        }
    },

    // ==================== NOTIFICATIONS ====================
    initNotifications() {
        const notificationBtn = document.getElementById("notificationBtn");
        const notificationPanel = document.getElementById("notificationPanel");
        const clearNotifications = document.getElementById("clearNotifications");

        if (notificationBtn && notificationPanel) {
            notificationBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                notificationPanel.classList.toggle("active");
                await this.loadNotifications();
            });

            // Close panel when clicking outside
            document.addEventListener("click", (e) => {
                if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                    notificationPanel.classList.remove("active");
                }
            });
        }

        if (clearNotifications) {
            clearNotifications.addEventListener("click", async () => {
                try {
                    await Storage.clearNotifications();
                    await this.loadNotifications();
                    Utils.showToast("Notifications cleared", "success");
                } catch (error) {
                    console.error('Clear notifications error:', error);
                }
            });
        }

        // Update badge on load
        this.updateNotificationBadge();
    },

    async loadNotifications() {
        const list = document.getElementById('notificationList');
        const badge = document.getElementById('notificationBadge');

        if (!list) return;

        try {
            const notifications = await Storage.getNotifications();

            // Ensure notifications is an array
            const notificationArray = Array.isArray(notifications) ? notifications : [];

            const unreadCount = notificationArray.filter(n => !n.read).length;

            // Update badge
            if (badge) {
                badge.textContent = unreadCount > 0 ? unreadCount : '';
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }

            if (notificationArray.length === 0) {
                list.innerHTML = `
                    <div class="empty-notifications">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = notificationArray.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" onclick="App.markNotificationRead('${n.id}')">
                    <div class="notification-icon ${n.type || 'info'}">
                        <i class="fas ${this.getNotificationIcon(n.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <h5>${n.title || 'Notification'}</h5>
                        <p>${n.message || ''}</p>
                        <span class="time">${Utils.getRelativeTime(n.createdAt || new Date())}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading notifications:', error);
            list.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
        }
    },

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-times-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    },

    async markNotificationRead(id) {
        try {
            await Storage.markNotificationRead(id);
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    },

    async updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        try {
            const notifications = await Storage.getNotifications();

            // Ensure notifications is an array
            const notificationArray = Array.isArray(notifications) ? notifications : [];

            const unreadCount = notificationArray.filter(n => !n.read).length;

            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';

        } catch (error) {
            console.error('Error updating notification badge:', error);
            badge.style.display = 'none';
        }
    },

    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        const userDropdown = document.getElementById('userDropdown');

        // Close user dropdown if open
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }

        // Toggle notification dropdown
        if (dropdown) {
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');

            // Load notifications when opening
            if (!isOpen) {
                this.loadNotifications();
            }
        }
    },

    async clearAllNotifications() {
        if (confirm('Clear all notifications?')) {
            try {
                await Storage.clearNotifications();
                await this.loadNotifications();
                Utils.showToast('Notifications cleared', 'success');
            } catch (error) {
                console.error('Error clearing notifications:', error);
                Utils.showToast('Error clearing notifications', 'error');
            }
        }
    },

    // ==================== USER MENU FUNCTIONS ====================
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        const profileBtn = document.getElementById('userProfileBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');

        // Close notification dropdown if open
        if (notificationDropdown) {
            notificationDropdown.classList.remove('show');
        }

        // Toggle user dropdown
        if (dropdown) {
            dropdown.classList.toggle('show');
        }

        if (profileBtn) {
            profileBtn.classList.toggle('active');
        }
    },

    updateUserProfile(user) {
        if (!user) return;

        const name = user.displayName || 'User';
        const email = user.email || '';
        const photoURL = user.photoURL;

        // Update all user name elements
        const nameElements = document.querySelectorAll('#userName, #userFullName, .user-name');
        nameElements.forEach(el => {
            if (el) el.textContent = name;
        });

        // Update all email elements
        const emailElements = document.querySelectorAll('#userEmail, .user-email');
        emailElements.forEach(el => {
            if (el) el.textContent = email;
        });

        // Update avatar with photo or initial
        const avatarElements = document.querySelectorAll('#userAvatar, #userAvatarLarge, .user-avatar');
        avatarElements.forEach(el => {
            if (el) {
                if (photoURL) {
                    el.innerHTML = `<img src="${photoURL}" alt="${name}">`;
                } else {
                    const initial = name.charAt(0).toUpperCase();
                    el.innerHTML = `<span style="font-weight:600">${initial}</span>`;
                }
            }
        });
    },

    // Close dropdowns when clicking outside
    initDropdownClose() {
        document.addEventListener('click', (e) => {
            const notificationWrapper = document.getElementById('notificationWrapper');
            const userProfileBtn = document.getElementById('userProfileBtn');
            const notificationDropdown = document.getElementById('notificationDropdown');
            const userDropdown = document.getElementById('userDropdown');

            // Close notification dropdown
            if (notificationWrapper && !notificationWrapper.contains(e.target)) {
                if (notificationDropdown) {
                    notificationDropdown.classList.remove('show');
                }
            }

            // Close user dropdown
            if (userProfileBtn && !userProfileBtn.contains(e.target)) {
                if (userDropdown) {
                    userDropdown.classList.remove('show');
                }
                userProfileBtn.classList.remove('active');
            }
        });
    },

    // ==================== EXPORT ====================
    initExport() {
        const exportCSV = document.getElementById("exportCSV");
        const exportPDF = document.getElementById("exportPDF");

        if (exportCSV) {
            exportCSV.addEventListener("click", async () => {
                try {
                    const transactions = await Storage.getTransactions();
                    Utils.exportToCSV(transactions);
                    Utils.showToast("CSV exported!", "success");
                } catch (error) {
                    console.error('Export CSV error:', error);
                    Utils.showToast("Export failed", "error");
                }
            });
        }

        if (exportPDF) {
            exportPDF.addEventListener("click", () => {
                Utils.showToast("PDF export coming soon!", "info");
            });
        }
    },

    // ==================== BORROW MODULE ====================
    initBorrowModule() {
        // Tab switching
        document.querySelectorAll(".borrow-tabs .tab-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".borrow-tabs .tab-btn").forEach((b) => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
                btn.classList.add("active");

                const tabId = btn.dataset.tab + "Tab";
                const tabContent = document.getElementById(tabId);
                if (tabContent) tabContent.classList.add("active");
            });
        });

        // Add buttons
        const addLendBtn = document.getElementById("addLendBtn");
        const addBorrowBtn = document.getElementById("addBorrowBtn");

        if (addLendBtn) {
            addLendBtn.addEventListener("click", () => {
                this.openBorrowModal("given");
            });
        }

        if (addBorrowBtn) {
            addBorrowBtn.addEventListener("click", () => {
                this.openBorrowModal("taken");
            });
        }

        // Modal handlers
        const closeBorrowModal = document.getElementById("closeBorrowModal");
        const cancelBorrow = document.getElementById("cancelBorrow");

        [closeBorrowModal, cancelBorrow].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    const modal = document.getElementById("borrowModal");
                    if (modal) modal.classList.remove("active");
                });
            }
        });

        // Status buttons
        document.querySelectorAll(".status-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".status-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                const partialSection = document.querySelector(".partial-payment-section");
                if (partialSection) {
                    partialSection.style.display =
                        btn.dataset.status === "partial" || btn.dataset.status === "completed"
                            ? "block"
                            : "none";
                }
            });
        });

        // Form submission
        const borrowForm = document.getElementById("borrowForm");
        if (borrowForm) {
            borrowForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveBorrowRecord();
            });
        }

        // Payment modal
        const closePaymentModal = document.getElementById("closePaymentModal");
        if (closePaymentModal) {
            closePaymentModal.addEventListener("click", () => {
                const modal = document.getElementById("paymentModal");
                if (modal) modal.classList.remove("active");
            });
        }

        const addPaymentForm = document.getElementById("addPaymentForm");
        if (addPaymentForm) {
            addPaymentForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.addPaymentRecord();
            });
        }

        // Close modals on outside click
        const borrowModal = document.getElementById("borrowModal");
        const paymentModal = document.getElementById("paymentModal");

        [borrowModal, paymentModal].forEach((modal) => {
            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        modal.classList.remove("active");
                    }
                });
            }
        });
    },

    async openBorrowModal(type, editId = null) {
        const modal = document.getElementById("borrowModal");
        const form = document.getElementById("borrowForm");
        const modalTitle = document.getElementById("borrowModalTitle");

        if (!modal || !form) return;

        form.reset();
        this.editingBorrow = editId;

        const borrowType = document.getElementById("borrowType");
        const borrowId = document.getElementById("borrowId");
        const borrowDate = document.getElementById("borrowDate");

        if (borrowType) borrowType.value = type;
        if (borrowId) borrowId.value = editId || "";
        if (borrowDate) borrowDate.value = new Date().toISOString().split("T")[0];

        // Reset status buttons
        document.querySelectorAll(".status-btn").forEach((b) => b.classList.remove("active"));
        const pendingBtn = document.querySelector('.status-btn[data-status="pending"]');
        if (pendingBtn) pendingBtn.classList.add("active");

        const partialSection = document.querySelector(".partial-payment-section");
        if (partialSection) partialSection.style.display = "none";

        // Set title
        if (modalTitle) {
            if (type === "given") {
                modalTitle.textContent = editId ? "Edit - Money Given" : "Money Given (Lent to Someone)";
            } else {
                modalTitle.textContent = editId ? "Edit - Money Taken" : "Money Taken (Borrowed from Someone)";
            }
        }

        // If editing, populate form
        if (editId) {
            try {
                const borrows = await Storage.getBorrows();
                const borrow = Array.isArray(borrows) ? borrows.find((b) => b.id === editId) : null;

                if (borrow) {
                    const fields = {
                        borrowPerson: borrow.person,
                        borrowAmount: borrow.amount,
                        borrowDate: borrow.date,
                        borrowDueDate: borrow.dueDate || "",
                        borrowInterest: borrow.interest || "",
                        borrowReason: borrow.reason || "",
                        borrowContact: borrow.contact || "",
                        borrowNotes: borrow.notes || "",
                        borrowPaidAmount: borrow.paidAmount || "",
                    };

                    Object.entries(fields).forEach(([id, value]) => {
                        const el = document.getElementById(id);
                        if (el) el.value = value;
                    });

                    // Set status
                    document.querySelectorAll(".status-btn").forEach((b) => b.classList.remove("active"));
                    const statusBtn = document.querySelector(`.status-btn[data-status="${borrow.status}"]`);
                    if (statusBtn) statusBtn.classList.add("active");

                    if (borrow.status === "partial" || borrow.status === "completed") {
                        if (partialSection) partialSection.style.display = "block";
                    }
                }
            } catch (error) {
                console.error('openBorrowModal error:', error);
            }
        }

        modal.classList.add("active");
    },

    async saveBorrowRecord() {
        const type = document.getElementById("borrowType")?.value;
        const editId = document.getElementById("borrowId")?.value;

        const record = {
            type,
            person: document.getElementById("borrowPerson")?.value,
            amount: parseFloat(document.getElementById("borrowAmount")?.value),
            date: document.getElementById("borrowDate")?.value,
            dueDate: document.getElementById("borrowDueDate")?.value || null,
            interest: parseFloat(document.getElementById("borrowInterest")?.value) || 0,
            reason: document.getElementById("borrowReason")?.value || "",
            contact: document.getElementById("borrowContact")?.value || "",
            notes: document.getElementById("borrowNotes")?.value || "",
            status: document.querySelector(".status-btn.active")?.dataset.status || "pending",
            paidAmount: parseFloat(document.getElementById("borrowPaidAmount")?.value) || 0,
        };

        // Validation
        if (!record.person || !record.amount || !record.date) {
            Utils.showToast("Please fill in required fields", "error");
            return;
        }

        try {
            if (editId) {
                await Storage.updateBorrow(editId, record);
                Utils.showToast("Record updated successfully!", "success");
            } else {
                await Storage.addBorrow(record);
                Utils.showToast("Record added successfully!", "success");
            }

            const modal = document.getElementById("borrowModal");
            if (modal) modal.classList.remove("active");

            await this.loadBorrowPage();
        } catch (error) {
            console.error('saveBorrowRecord error:', error);
            Utils.showToast("Failed to save record", "error");
        }
    },

    async loadBorrowPage() {
        try {
            const borrows = await Storage.getBorrows();
            const borrowsArray = Array.isArray(borrows) ? borrows : [];
            
            const given = borrowsArray.filter((b) => b.type === "given" && b.status !== "completed");
            const taken = borrowsArray.filter((b) => b.type === "taken" && b.status !== "completed");
            const completed = borrowsArray.filter((b) => b.status === "completed");

            // Calculate totals
            const totalGiven = given.reduce(
                (sum, b) => sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
                0
            );
            const totalTaken = taken.reduce(
                (sum, b) => sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
                0
            );
            const netBalance = totalGiven - totalTaken;

            // Calculate overdue
            const today = new Date().toISOString().split("T")[0];
            const overdueBorrows = borrowsArray.filter(
                (b) => b.dueDate && b.dueDate < today && b.status !== "completed"
            );
            const overdueAmount = overdueBorrows.reduce(
                (sum, b) => sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
                0
            );

            // Update summary cards
            const summaryElements = {
                totalGiven: Utils.formatCurrency(totalGiven),
                givenCount: given.length,
                totalTaken: Utils.formatCurrency(totalTaken),
                takenCount: taken.length,
                netBorrow: Utils.formatCurrency(Math.abs(netBalance)),
                overdueAmount: Utils.formatCurrency(overdueAmount),
                overdueCount: overdueBorrows.length,
            };

            Object.entries(summaryElements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });

            // Update net balance label
            const netCard = document.querySelector("#netBorrow")?.closest(".summary-info");
            if (netCard) {
                const countEl = netCard.querySelector(".summary-count");
                if (countEl) {
                    countEl.textContent = netBalance >= 0 ? "You'll receive" : "You owe";
                }
            }

            // Render lists
            this.renderBorrowList("givenList", given, "given");
            this.renderBorrowList("takenList", taken, "taken");
            this.renderBorrowHistory(completed);
        } catch (error) {
            console.error('loadBorrowPage error:', error);
        }
    },

    renderBorrowList(containerId, items, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const today = new Date().toISOString().split("T")[0];

        if (!Array.isArray(items) || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hand-holding-usd"></i>
                    <p>No ${type === "given" ? "money given" : "money taken"} records</p>
                    <button class="add-btn small" onclick="App.openBorrowModal('${type}')">
                        <i class="fas fa-plus"></i> Add Record
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = items
            .map((item, index) => {
                const isOverdue = item.dueDate && item.dueDate < today && item.status !== "completed";
                const remaining = parseFloat(item.amount) - (parseFloat(item.paidAmount) || 0);
                const progress = ((parseFloat(item.paidAmount) || 0) / parseFloat(item.amount)) * 100;
                const initials = item.person
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                return `
                    <div class="borrow-item ${item.type} ${isOverdue ? "overdue" : ""} ${item.status === "completed" ? "completed" : ""}" 
                         style="animation-delay: ${index * 0.1}s">
                        <div class="borrow-avatar">${initials}</div>
                        <div class="borrow-details">
                            <h4>
                                ${item.person}
                                ${isOverdue ? '<span class="overdue-badge">Overdue!</span>' : ""}
                            </h4>
                            <div class="borrow-meta">
                                <span><i class="fas fa-calendar"></i> ${Utils.formatDate(item.date)}</span>
                                ${item.dueDate ? `<span><i class="fas fa-clock"></i> Due: ${Utils.formatDate(item.dueDate)}</span>` : ""}
                                ${item.reason ? `<span><i class="fas fa-tag"></i> ${item.reason}</span>` : ""}
                            </div>
                            ${item.status === "partial"
                                ? `
                                <div class="borrow-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%; background: var(--success)"></div>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                        </div>
                        <div class="borrow-amount-section">
                            <div class="borrow-amount">${Utils.formatCurrency(item.amount)}</div>
                            ${remaining < item.amount ? `<div class="borrow-remaining">Remaining: ${Utils.formatCurrency(remaining)}</div>` : ""}
                            <span class="status-badge ${item.status}">
                                <i class="fas ${item.status === "pending" ? "fa-clock" : item.status === "partial" ? "fa-adjust" : "fa-check"}"></i>
                                ${item.status}
                            </span>
                        </div>
                        <div class="borrow-actions-btns">
                            <button class="borrow-action-btn payment" onclick="App.openPaymentModal('${item.id}')" title="Record Payment">
                                <i class="fas fa-dollar-sign"></i>
                            </button>
                            <button class="borrow-action-btn edit" onclick="App.openBorrowModal('${item.type}', '${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="borrow-action-btn delete" onclick="App.deleteBorrowRecord('${item.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    },

    renderBorrowHistory(items) {
        const container = document.getElementById("borrowHistory");
        if (!container) return;

        if (!Array.isArray(items) || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No completed transactions yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-timeline">
                ${items
                    .map((item) => {
                        const initials = item.person
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                        return `
                            <div class="history-item">
                                <div class="history-item-content">
                                    <div class="borrow-avatar small" style="background: ${item.type === "given" ? "var(--gradient-success)" : "var(--gradient-danger)"}">
                                        ${initials}
                                    </div>
                                    <div class="history-item-details">
                                        <strong>${item.person}</strong>
                                        <p>${item.type === "given" ? "Received back" : "Paid back"} ${Utils.formatCurrency(item.amount)}</p>
                                    </div>
                                </div>
                                <span class="history-date">${Utils.formatDate(item.date)}</span>
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        `;
    },

    async openPaymentModal(borrowId) {
        try {
            const borrows = await Storage.getBorrows();
            const borrow = Array.isArray(borrows) ? borrows.find((b) => b.id === borrowId) : null;

            if (!borrow) return;

            const remaining = parseFloat(borrow.amount) - (parseFloat(borrow.paidAmount) || 0);
            const totalPaid = parseFloat(borrow.paidAmount) || 0;

            const paymentBorrowId = document.getElementById("paymentBorrowId");
            const paymentDate = document.getElementById("paymentDate");
            const paymentAmount = document.getElementById("paymentAmount");
            const paymentNote = document.getElementById("paymentNote");

            if (paymentBorrowId) paymentBorrowId.value = borrowId;
            if (paymentDate) paymentDate.value = new Date().toISOString().split("T")[0];
            if (paymentAmount) paymentAmount.value = "";
            if (paymentNote) paymentNote.value = "";

            // Update payment details
            const paymentDetails = document.getElementById("paymentDetails");
            if (paymentDetails) {
                paymentDetails.innerHTML = `
                    <div class="payment-details-header">
                        <h4>${borrow.person}</h4>
                        <span class="status-badge ${borrow.status}">${borrow.status}</span>
                    </div>
                    <div class="payment-details-grid">
                        <div class="payment-detail-item">
                            <span class="label">Total Amount</span>
                            <span class="value">${Utils.formatCurrency(borrow.amount)}</span>
                        </div>
                        <div class="payment-detail-item">
                            <span class="label">Paid</span>
                            <span class="value positive">${Utils.formatCurrency(totalPaid)}</span>
                        </div>
                        <div class="payment-detail-item">
                            <span class="label">Remaining</span>
                            <span class="value negative">${Utils.formatCurrency(remaining)}</span>
                        </div>
                    </div>
                `;
            }

            // Update payment history
            const paymentHistoryList = document.getElementById("paymentHistoryList");
            if (paymentHistoryList) {
                if (borrow.payments && borrow.payments.length > 0) {
                    paymentHistoryList.innerHTML = borrow.payments
                        .map(
                            (p) => `
                            <div class="payment-history-item">
                                <div class="payment-info">
                                    <div class="payment-icon"><i class="fas fa-check"></i></div>
                                    <div>
                                        <div class="payment-amount">+${Utils.formatCurrency(p.amount)}</div>
                                        <div class="payment-note">${p.note || "Payment"}</div>
                                    </div>
                                </div>
                                <span class="payment-date">${Utils.formatDate(p.date)}</span>
                            </div>
                        `
                        )
                        .join("");
                } else {
                    paymentHistoryList.innerHTML = `
                        <div class="empty-message">
                            <p>No payments recorded yet</p>
                        </div>
                    `;
                }
            }

            const modal = document.getElementById("paymentModal");
            if (modal) modal.classList.add("active");
        } catch (error) {
            console.error('openPaymentModal error:', error);
        }
    },

    async addPaymentRecord() {
        const borrowId = document.getElementById("paymentBorrowId")?.value;
        const amount = parseFloat(document.getElementById("paymentAmount")?.value);
        const date = document.getElementById("paymentDate")?.value;
        const note = document.getElementById("paymentNote")?.value || "";

        if (!amount || amount <= 0) {
            Utils.showToast("Please enter a valid amount", "error");
            return;
        }

        if (!date) {
            Utils.showToast("Please select a date", "error");
            return;
        }

        try {
            await Storage.addPayment(borrowId, { amount, date, note });
            Utils.showToast("Payment recorded successfully!", "success");

            const modal = document.getElementById("paymentModal");
            if (modal) modal.classList.remove("active");

            await this.loadBorrowPage();
            await this.loadDashboardOverview();
        } catch (error) {
            console.error('addPaymentRecord error:', error);
            Utils.showToast("Failed to record payment", "error");
        }
    },

    async deleteBorrowRecord(id) {
        if (confirm("Are you sure you want to delete this record?")) {
            try {
                await Storage.deleteBorrow(id);
                Utils.showToast("Record deleted", "success");
                await this.loadBorrowPage();
            } catch (error) {
                console.error('deleteBorrowRecord error:', error);
                Utils.showToast("Failed to delete record", "error");
            }
        }
    },

    // ==================== WISHLIST MODULE ====================
    initWishlistModule() {
        // Add button
        const addWishlistBtn = document.getElementById("addWishlistBtn");
        if (addWishlistBtn) {
            addWishlistBtn.addEventListener("click", () => {
                this.openWishlistModal();
            });
        }

        // Modal handlers
        const closeWishlistModal = document.getElementById("closeWishlistModal");
        const cancelWishlist = document.getElementById("cancelWishlist");

        [closeWishlistModal, cancelWishlist].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    const modal = document.getElementById("wishlistModal");
                    if (modal) modal.classList.remove("active");
                });
            }
        });

        // Form submission
        const wishlistForm = document.getElementById("wishlistForm");
        if (wishlistForm) {
            wishlistForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveWishlistItem();
            });
        }

        // Image preview
        const wishlistImage = document.getElementById("wishlistImage");
        if (wishlistImage) {
            wishlistImage.addEventListener("input", (e) => {
                const preview = document.getElementById("wishlistImagePreview");
                if (preview) {
                    if (e.target.value) {
                        preview.innerHTML = `<img src="${e.target.value}" onerror="this.style.display='none'" alt="Preview">`;
                    } else {
                        preview.innerHTML = "";
                    }
                }
            });
        }

        // Filters
        const filterElements = ["wishlistPriorityFilter", "wishlistCategoryFilter", "wishlistSort"];
        filterElements.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", async () => await this.filterWishlist());
            }
        });

        // View toggle
        document.querySelectorAll("#wishlist .view-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#wishlist .view-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                const grid = document.getElementById("wishlistGrid");
                if (grid) {
                    grid.classList.toggle("list-view", btn.dataset.view === "list");
                }
            });
        });

        // Close modal on outside click
        const wishlistModal = document.getElementById("wishlistModal");
        if (wishlistModal) {
            wishlistModal.addEventListener("click", (e) => {
                if (e.target === wishlistModal) {
                    wishlistModal.classList.remove("active");
                }
            });
        }
    },

    async openWishlistModal(editId = null) {
        const modal = document.getElementById("wishlistModal");
        const form = document.getElementById("wishlistForm");
        const modalTitle = document.getElementById("wishlistModalTitle");

        if (!modal || !form) return;

        form.reset();
        this.editingWishlist = editId;

        const wishlistItemId = document.getElementById("wishlistItemId");
        const wishlistImagePreview = document.getElementById("wishlistImagePreview");

        if (wishlistItemId) wishlistItemId.value = editId || "";
        if (wishlistImagePreview) wishlistImagePreview.innerHTML = "";

        if (editId) {
            if (modalTitle) modalTitle.textContent = "Edit Future Purchase";

            try {
                const wishlist = await Storage.getWishlist();
                const item = Array.isArray(wishlist) ? wishlist.find((w) => w.id === editId) : null;

                if (item) {
                    const fields = {
                        wishlistName: item.name,
                        wishlistPrice: item.price,
                        wishlistSavedAmount: item.savedAmount || "",
                        wishlistCategory: item.category,
                        wishlistPriority: item.priority,
                        wishlistTargetDate: item.targetDate || "",
                        wishlistLink: item.link || "",
                        wishlistDescription: item.description || "",
                        wishlistImage: item.image || "",
                    };

                    Object.entries(fields).forEach(([id, value]) => {
                        const el = document.getElementById(id);
                        if (el) el.value = value;
                    });

                    if (item.image && wishlistImagePreview) {
                        wishlistImagePreview.innerHTML = `<img src="${item.image}" alt="Preview">`;
                    }
                }
            } catch (error) {
                console.error('openWishlistModal error:', error);
            }
        } else {
            if (modalTitle) modalTitle.textContent = "Add Future Purchase";
        }

        modal.classList.add("active");
    },

    async saveWishlistItem() {
        const editId = document.getElementById("wishlistItemId")?.value;

        const item = {
            name: document.getElementById("wishlistName")?.value,
            price: parseFloat(document.getElementById("wishlistPrice")?.value),
            savedAmount: parseFloat(document.getElementById("wishlistSavedAmount")?.value) || 0,
            category: document.getElementById("wishlistCategory")?.value,
            priority: document.getElementById("wishlistPriority")?.value,
            targetDate: document.getElementById("wishlistTargetDate")?.value || null,
            link: document.getElementById("wishlistLink")?.value || "",
            description: document.getElementById("wishlistDescription")?.value || "",
            image: document.getElementById("wishlistImage")?.value || "",
        };

        // Validation
        if (!item.name || !item.price) {
            Utils.showToast("Please fill in required fields", "error");
            return;
        }

        try {
            if (editId) {
                await Storage.updateWishlistItem(editId, item);
                Utils.showToast("Item updated!", "success");
            } else {
                await Storage.addWishlistItem(item);
                Utils.showToast("Item added to wishlist!", "success");
            }

            const modal = document.getElementById("wishlistModal");
            if (modal) modal.classList.remove("active");

            await this.loadWishlistPage();
        } catch (error) {
            console.error('saveWishlistItem error:', error);
            Utils.showToast("Failed to save item", "error");
        }
    },

    async loadWishlistPage() {
        try {
            const wishlist = await Storage.getWishlist();
            const wishlistArray = Array.isArray(wishlist) ? wishlist.filter((w) => !w.purchased) : [];

            // Calculate summaries
            const totalCost = wishlistArray.reduce((sum, w) => sum + parseFloat(w.price), 0);
            const totalSaved = wishlistArray.reduce((sum, w) => sum + (parseFloat(w.savedAmount) || 0), 0);
            const highPriority = wishlistArray.filter((w) => w.priority === "high").length;

            // Update summary cards
            const summaryElements = {
                wishlistCount: wishlistArray.length,
                wishlistTotal: Utils.formatCurrency(totalCost),
                wishlistSaved: Utils.formatCurrency(totalSaved),
                highPriorityCount: highPriority,
            };

            Object.entries(summaryElements).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });

            this.renderWishlist(wishlistArray);
        } catch (error) {
            console.error('loadWishlistPage error:', error);
        }
    },

    async filterWishlist() {
        try {
            let wishlist = await Storage.getWishlist();
            wishlist = Array.isArray(wishlist) ? wishlist.filter((w) => !w.purchased) : [];

            const priority = document.getElementById("wishlistPriorityFilter")?.value || "all";
            const category = document.getElementById("wishlistCategoryFilter")?.value || "all";
            const sort = document.getElementById("wishlistSort")?.value || "priority";

            // Apply filters
            if (priority !== "all") {
                wishlist = wishlist.filter((w) => w.priority === priority);
            }

            if (category !== "all") {
                wishlist = wishlist.filter((w) => w.category === category);
            }

            // Apply sort
            switch (sort) {
                case "priority":
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    wishlist.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                    break;
                case "price-high":
                    wishlist.sort((a, b) => b.price - a.price);
                    break;
                case "price-low":
                    wishlist.sort((a, b) => a.price - b.price);
                    break;
                case "date":
                    wishlist.sort(
                        (a, b) => new Date(a.targetDate || "9999") - new Date(b.targetDate || "9999")
                    );
                    break;
                case "progress":
                    wishlist.sort(
                        (a, b) => (b.savedAmount || 0) / b.price - (a.savedAmount || 0) / a.price
                    );
                    break;
            }

            this.renderWishlist(wishlist);
        } catch (error) {
            console.error('filterWishlist error:', error);
        }
    },

    renderWishlist(items) {
        const container = document.getElementById("wishlistGrid");
        if (!container) return;

        const categoryIcons = {
            electronics: "📱",
            clothing: "👕",
            home: "🏠",
            travel: "✈️",
            education: "📚",
            health: "💪",
            entertainment: "🎮",
            vehicle: "🚗",
            other: "📦",
        };

        if (!Array.isArray(items) || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-shopping-basket"></i>
                    <p>No items in your wishlist</p>
                    <button class="add-btn" onclick="App.openWishlistModal()">
                        <i class="fas fa-plus"></i> Add First Item
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = items
            .map((item, index) => {
                const progress = item.price > 0 ? ((item.savedAmount || 0) / item.price) * 100 : 0;
                const icon = categoryIcons[item.category] || "📦";

                return `
                    <div class="wishlist-item animate-card" style="animation-delay: ${index * 0.1}s">
                        <div class="wishlist-image">
                            ${item.image
                                ? `<img src="${item.image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" alt="${item.name}">
                                 <div class="placeholder-icon" style="display:none">${icon}</div>`
                                : `<div class="placeholder-icon">${icon}</div>`
                            }
                            <span class="wishlist-priority-badge ${item.priority}">${item.priority}</span>
                        </div>
                        <div class="wishlist-content">
                            <div class="wishlist-category">${icon} ${item.category}</div>
                            <h3>${item.name}</h3>
                            <div class="wishlist-price">${Utils.formatCurrency(item.price)}</div>
                            
                            <div class="wishlist-progress-section">
                                <div class="wishlist-progress-header">
                                    <span>Saved</span>
                                    <span>${Utils.formatCurrency(item.savedAmount || 0)} (${progress.toFixed(0)}%)</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(progress, 100)}%; background: var(--gradient-success)"></div>
                                </div>
                            </div>
                            
                            ${item.targetDate
                                ? `
                                <div class="wishlist-target-date">
                                    <i class="fas fa-calendar-alt"></i>
                                    Target: ${Utils.formatDate(item.targetDate)}
                                </div>
                            `
                                : ""
                            }
                            
                            ${item.description
                                ? `
                                <div class="wishlist-description">${item.description}</div>
                            `
                                : ""
                            }
                            
                            <div class="wishlist-actions">
                                <button class="wishlist-btn primary" onclick="App.addSavingsToWishlist('${item.id}')">
                                    <i class="fas fa-plus"></i> Add Savings
                                </button>
                                <button class="wishlist-btn secondary" onclick="App.openWishlistModal('${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <div class="wishlist-actions secondary-actions">
                                ${item.link
                                    ? `
                                    <button class="wishlist-btn link" onclick="window.open('${item.link}', '_blank')">
                                        <i class="fas fa-external-link-alt"></i> View
                                    </button>
                                `
                                    : ""
                                }
                                <button class="wishlist-btn success" onclick="App.markWishlistPurchased('${item.id}')">
                                    <i class="fas fa-check"></i> Purchased
                                </button>
                                <button class="wishlist-btn danger" onclick="App.deleteWishlistItem('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join("");
    },

    async addSavingsToWishlist(id) {
        try {
            const wishlist = await Storage.getWishlist();
            const item = Array.isArray(wishlist) ? wishlist.find((w) => w.id === id) : null;

            if (!item) return;

            const remaining = item.price - (item.savedAmount || 0);
            const amount = prompt(
                `Add savings for "${item.name}"\n\nRemaining: ${Utils.formatCurrency(remaining)}\n\nEnter amount:`
            );

            if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                const newSaved = (parseFloat(item.savedAmount) || 0) + parseFloat(amount);
                await Storage.updateWishlistItem(id, { savedAmount: newSaved });

                const progress = (newSaved / item.price) * 100;
                if (progress >= 100) {
                    Utils.showToast(`🎉 Goal reached for "${item.name}"!`, "success");
                } else {
                    Utils.showToast(
                        `Added ${Utils.formatCurrency(parseFloat(amount))} to savings!`,
                        "success"
                    );
                }

                await this.loadWishlistPage();
            }
        } catch (error) {
            console.error('addSavingsToWishlist error:', error);
        }
    },

    async markWishlistPurchased(id) {
        try {
            const wishlist = await Storage.getWishlist();
            const item = Array.isArray(wishlist) ? wishlist.find((w) => w.id === id) : null;

            if (!item) return;

            if (confirm(`Mark "${item.name}" as purchased?`)) {
                await Storage.markAsPurchased(id);
                Utils.showToast("Item marked as purchased! 🎉", "success");
                await this.loadWishlistPage();
            }
        } catch (error) {
            console.error('markWishlistPurchased error:', error);
        }
    },

    async deleteWishlistItem(id) {
        if (confirm("Delete this item from wishlist?")) {
            try {
                await Storage.deleteWishlistItem(id);
                Utils.showToast("Item deleted", "success");
                await this.loadWishlistPage();
            } catch (error) {
                console.error('deleteWishlistItem error:', error);
            }
        }
    },

    // ==================== NOTES MODULE ====================
    initNotesModule() {
        // Add button
        const addNoteBtn = document.getElementById("addNoteBtn");
        if (addNoteBtn) {
            addNoteBtn.addEventListener("click", () => {
                this.openNoteModal();
            });
        }

        // Modal handlers
        const closeNoteModal = document.getElementById("closeNoteModal");
        const cancelNote = document.getElementById("cancelNote");

        [closeNoteModal, cancelNote].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => {
                    const modal = document.getElementById("noteModal");
                    if (modal) modal.classList.remove("active");
                });
            }
        });

        // View note modal handlers
        const closeViewNoteModal = document.getElementById("closeViewNoteModal");
        if (closeViewNoteModal) {
            closeViewNoteModal.addEventListener("click", () => {
                const modal = document.getElementById("viewNoteModal");
                if (modal) modal.classList.remove("active");
            });
        }

        // Note colors
        document.querySelectorAll(".note-color").forEach((color) => {
            color.addEventListener("click", () => {
                document.querySelectorAll(".note-color").forEach((c) => c.classList.remove("active"));
                color.classList.add("active");
            });
        });

        // Editor toolbar
        document.querySelectorAll(".editor-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const command = btn.dataset.command;
                if (command === "createLink") {
                    const url = prompt("Enter URL:");
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, null);
                }
            });
        });

        // Form submission
        const noteForm = document.getElementById("noteForm");
        if (noteForm) {
            noteForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.saveNote();
            });
        }

        // Search
        const notesSearch = document.getElementById("notesSearch");
        if (notesSearch) {
            notesSearch.addEventListener(
                "input",
                Utils.debounce(async () => {
                    await this.filterNotes();
                }, 300)
            );
        }

        // Filter chips
        document.querySelectorAll("#notes .filter-chip").forEach((chip) => {
            chip.addEventListener("click", async () => {
                document.querySelectorAll("#notes .filter-chip").forEach((c) => c.classList.remove("active"));
                chip.classList.add("active");
                await this.filterNotes();
            });
        });

        // View toggle
        document.querySelectorAll("#notes .view-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#notes .view-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                document.querySelectorAll(".notes-grid").forEach((grid) => {
                    grid.classList.toggle("list-view", btn.dataset.view === "list");
                });
            });
        });

        // View note actions
        const editNoteBtn = document.getElementById("editNoteBtn");
        if (editNoteBtn) {
            editNoteBtn.addEventListener("click", () => {
                const modal = document.getElementById("viewNoteModal");
                const noteId = modal?.dataset.noteId;
                if (noteId) {
                    modal.classList.remove("active");
                    this.openNoteModal(noteId);
                }
            });
        }

        const pinNoteBtn = document.getElementById("pinNoteBtn");
        if (pinNoteBtn) {
            pinNoteBtn.addEventListener("click", async () => {
                const modal = document.getElementById("viewNoteModal");
                const noteId = modal?.dataset.noteId;
                if (noteId) {
                    await Storage.toggleNotePin(noteId);
                    Utils.showToast("Note pin toggled!", "success");
                    modal.classList.remove("active");
                    await this.loadNotesPage();
                }
            });
        }

        const deleteNoteBtn = document.getElementById("deleteNoteBtn");
        if (deleteNoteBtn) {
            deleteNoteBtn.addEventListener("click", async () => {
                const modal = document.getElementById("viewNoteModal");
                const noteId = modal?.dataset.noteId;
                if (noteId && confirm("Delete this note?")) {
                    await Storage.deleteNote(noteId);
                    Utils.showToast("Note deleted", "success");
                    modal.classList.remove("active");
                    await this.loadNotesPage();
                }
            });
        }

        // Close modals on outside click
        const noteModal = document.getElementById("noteModal");
        const viewNoteModal = document.getElementById("viewNoteModal");

        [noteModal, viewNoteModal].forEach((modal) => {
            if (modal) {
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        modal.classList.remove("active");
                    }
                });
            }
        });
    },

    async openNoteModal(editId = null) {
        const modal = document.getElementById("noteModal");
        const form = document.getElementById("noteForm");
        const modalTitle = document.getElementById("noteModalTitle");

        if (!modal || !form) return;

        form.reset();
        this.editingNote = editId;

        const noteId = document.getElementById("noteId");
        const noteContent = document.getElementById("noteContent");

        if (noteId) noteId.value = editId || "";
        if (noteContent) noteContent.innerHTML = "";

        // Reset color selection
        document.querySelectorAll(".note-color").forEach((c) => c.classList.remove("active"));
        const defaultColor = document.querySelector('.note-color[data-color="#fff9c4"]');
        if (defaultColor) defaultColor.classList.add("active");

        if (editId) {
            if (modalTitle) modalTitle.textContent = "Edit Note";

            try {
                const notes = await Storage.getNotes();
                const note = Array.isArray(notes) ? notes.find((n) => n.id === editId) : null;

                if (note) {
                    const noteTitle = document.getElementById("noteTitle");
                    const noteCategory = document.getElementById("noteCategory");
                    const noteTags = document.getElementById("noteTags");
                    const notePinned = document.getElementById("notePinned");

                    if (noteTitle) noteTitle.value = note.title;
                    if (noteCategory) noteCategory.value = note.category;
                    if (noteContent) noteContent.innerHTML = note.content;
                    if (noteTags) noteTags.value = note.tags || "";
                    if (notePinned) notePinned.checked = note.pinned || false;

                    // Set color
                    document.querySelectorAll(".note-color").forEach((c) => c.classList.remove("active"));
                    const colorBtn = document.querySelector(`.note-color[data-color="${note.color}"]`);
                    if (colorBtn) colorBtn.classList.add("active");
                }
            } catch (error) {
                console.error('openNoteModal error:', error);
            }
        } else {
            if (modalTitle) modalTitle.textContent = "New Note";
        }

        modal.classList.add("active");

        // Focus on title
        setTimeout(() => {
            const noteTitle = document.getElementById("noteTitle");
            if (noteTitle) noteTitle.focus();
        }, 100);
    },

    async saveNote() {
        const editId = document.getElementById("noteId")?.value;
        const noteContent = document.getElementById("noteContent");

        const note = {
            title: document.getElementById("noteTitle")?.value,
            category: document.getElementById("noteCategory")?.value || "personal",
            content: noteContent?.innerHTML || "",
            color: document.querySelector(".note-color.active")?.dataset.color || "#fff9c4",
            tags: document.getElementById("noteTags")?.value || "",
            pinned: document.getElementById("notePinned")?.checked || false,
        };

        // Validation
        if (!note.title) {
            Utils.showToast("Please enter a title", "error");
            return;
        }

        if (!note.content || note.content === "<br>") {
            Utils.showToast("Please enter some content", "error");
            return;
        }

        try {
            if (editId) {
                await Storage.updateNote(editId, note);
                Utils.showToast("Note updated!", "success");
            } else {
                await Storage.addNote(note);
                Utils.showToast("Note created!", "success");
            }

            const modal = document.getElementById("noteModal");
            if (modal) modal.classList.remove("active");

            await this.loadNotesPage();
        } catch (error) {
            console.error('saveNote error:', error);
            Utils.showToast("Failed to save note", "error");
        }
    },

    async loadNotesPage() {
        try {
            const notes = await Storage.getNotes();
            const notesArray = Array.isArray(notes) ? notes : [];
            const pinned = notesArray.filter((n) => n.pinned);
            const unpinned = notesArray.filter((n) => !n.pinned);

            // Render pinned notes
            const pinnedSection = document.getElementById("pinnedSection");
            if (pinnedSection) {
                if (pinned.length > 0) {
                    pinnedSection.style.display = "block";
                    this.renderNotes("pinnedNotes", pinned);
                } else {
                    pinnedSection.style.display = "none";
                }
            }

            // Render all notes
            this.renderNotes("notesGrid", unpinned);
        } catch (error) {
            console.error('loadNotesPage error:', error);
        }
    },

    async filterNotes() {
        try {
            const search = document.getElementById("notesSearch")?.value.toLowerCase() || "";
            const filter = document.querySelector("#notes .filter-chip.active")?.dataset.filter || "all";

            let notes = await Storage.getNotes();
            notes = Array.isArray(notes) ? notes : [];

            // Apply search
            if (search) {
                notes = notes.filter(
                    (n) =>
                        n.title.toLowerCase().includes(search) ||
                        n.content.toLowerCase().includes(search) ||
                        (n.tags && n.tags.toLowerCase().includes(search))
                );
            }

            // Apply filter
            if (filter !== "all") {
                if (filter === "pinned") {
                    notes = notes.filter((n) => n.pinned);
                } else {
                    notes = notes.filter((n) => n.category === filter);
                }
            }

            const pinned = notes.filter((n) => n.pinned);
            const unpinned = notes.filter((n) => !n.pinned);

            const pinnedSection = document.getElementById("pinnedSection");
            if (pinnedSection) {
                if (pinned.length > 0 && filter !== "pinned") {
                    pinnedSection.style.display = "block";
                    this.renderNotes("pinnedNotes", pinned);
                } else {
                    pinnedSection.style.display = "none";
                }
            }

            this.renderNotes("notesGrid", filter === "pinned" ? pinned : unpinned);
        } catch (error) {
            console.error('filterNotes error:', error);
        }
    },

    renderNotes(containerId, notes) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categoryEmojis = {
            personal: "🏠",
            finance: "💰",
            goals: "🎯",
            ideas: "💡",
            reminders: "⏰",
            other: "📝",
        };

        if (!Array.isArray(notes) || notes.length === 0) {
            container.innerHTML =
                containerId === "notesGrid"
                    ? `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-sticky-note"></i>
                        <p>No notes found</p>
                        <button class="add-btn" onclick="App.openNoteModal()">
                            <i class="fas fa-plus"></i> Create Note
                        </button>
                    </div>
                `
                    : "";
            return;
        }

        container.innerHTML = notes
            .map((note, index) => {
                const plainContent = note.content.replace(/<[^>]*>/g, "");
                const emoji = categoryEmojis[note.category] || "📝";

                return `
                    <div class="note-card ${note.pinned ? "pinned" : ""}" 
                         style="background: ${note.color}; animation-delay: ${index * 0.05}s"
                         onclick="App.viewNote('${note.id}')">
                        <div class="note-card-header">
                            <h3>${note.title}</h3>
                            <div class="note-card-actions">
                                <button onclick="event.stopPropagation(); App.toggleNotePin('${note.id}')" title="${note.pinned ? "Unpin" : "Pin"}">
                                    <i class="fas fa-thumbtack" style="${note.pinned ? "color: var(--warning)" : ""}"></i>
                                </button>
                                <button onclick="event.stopPropagation(); App.openNoteModal('${note.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete" onclick="event.stopPropagation(); App.deleteNote('${note.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="note-card-content">${plainContent}</div>
                        ${note.tags
                            ? `
                            <div class="note-tags">
                                ${note.tags
                                    .split(",")
                                    .slice(0, 3)
                                    .map((tag) => `<span class="note-tag">${tag.trim()}</span>`)
                                    .join("")}
                            </div>
                        `
                            : ""
                        }
                        <div class="note-card-footer">
                            <span class="note-category-badge">${emoji} ${note.category}</span>
                            <span class="note-date">${Utils.getRelativeTime(note.updatedAt)}</span>
                        </div>
                    </div>
                `;
            })
            .join("");
    },

    async viewNote(id) {
        try {
            const notes = await Storage.getNotes();
            const note = Array.isArray(notes) ? notes.find((n) => n.id === id) : null;

            if (!note) return;

            const modal = document.getElementById("viewNoteModal");
            if (!modal) return;

            modal.dataset.noteId = id;

            const viewNoteHeader = document.getElementById("viewNoteHeader");
            const viewNoteTitle = document.getElementById("viewNoteTitle");
            const viewNoteContent = document.getElementById("viewNoteContent");
            const viewNoteCategory = document.getElementById("viewNoteCategory");
            const viewNoteDate = document.getElementById("viewNoteDate");
            const pinNoteBtn = document.getElementById("pinNoteBtn");

            if (viewNoteHeader) viewNoteHeader.style.background = note.color;
            if (viewNoteTitle) viewNoteTitle.textContent = note.title;
            if (viewNoteContent) viewNoteContent.innerHTML = note.content;

            const categoryEmojis = {
                personal: "🏠",
                finance: "💰",
                goals: "🎯",
                ideas: "💡",
                reminders: "⏰",
                other: "📝",
            };

            if (viewNoteCategory) {
                viewNoteCategory.innerHTML = `${categoryEmojis[note.category] || "📝"} ${note.category}`;
            }

            if (viewNoteDate) {
                viewNoteDate.textContent = `Last updated: ${Utils.formatDate(note.updatedAt, "full")}`;
            }

            // Update pin button
            if (pinNoteBtn) {
                pinNoteBtn.innerHTML = note.pinned
                    ? '<i class="fas fa-thumbtack" style="color: var(--warning)"></i>'
                    : '<i class="fas fa-thumbtack"></i>';
                pinNoteBtn.title = note.pinned ? "Unpin" : "Pin";
            }

            modal.classList.add("active");
        } catch (error) {
            console.error('viewNote error:', error);
        }
    },

    async toggleNotePin(id) {
        try {
            await Storage.toggleNotePin(id);
            Utils.showToast("Note pin toggled!", "success");
            await this.loadNotesPage();
        } catch (error) {
            console.error('toggleNotePin error:', error);
        }
    },

    async deleteNote(id) {
        if (confirm("Delete this note?")) {
            try {
                await Storage.deleteNote(id);
                Utils.showToast("Note deleted", "success");
                await this.loadNotesPage();
            } catch (error) {
                console.error('deleteNote error:', error);
            }
        }
    },

    // ==================== UTILITY METHODS ====================
    async refreshCurrentPage() {
        await this.navigateTo(this.currentPage);
        await this.updateStats();

        if (typeof Charts !== "undefined") {
            await Charts.updateAll();
        }
    },
};

// ==================== INITIALIZE APP ====================
// NOTE: App.init() is now called from app.html after Firebase auth
// Do NOT call App.init() here!

// ==================== SERVICE WORKER REGISTRATION ====================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                console.log("ServiceWorker registered:", registration.scope);
            })
            .catch((error) => {
                console.log("ServiceWorker registration failed:", error);
            });
    });
}