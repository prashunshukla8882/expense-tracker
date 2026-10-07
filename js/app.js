// ==================== APP.JS - COMPLETE EXPENSE TRACKER APPLICATION ====================
// Global date helper function
function toLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}


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
      
      // Initialize calendar date
        this.currentCalendarDate = new Date();

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
  
      // Helper: Format date as YYYY-MM-DD in LOCAL timezone
      function toLocalDateString(date) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
      }
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
    
    // Save partial payment
// Save partial payment
async savePayment() {
    try {
        const borrowId = document.getElementById('paymentBorrowId')?.value;
        const amount = parseFloat(document.getElementById('paymentAmount')?.value) || 0;
        const date = document.getElementById('paymentDate')?.value;
        const note = document.getElementById('paymentNote')?.value || '';

        // Validation
        if (!borrowId) {
            Utils.showToast('Error: No borrow record selected', 'error');
            return;
        }

        if (amount <= 0) {
            Utils.showToast('Please enter a valid amount', 'error');
            return;
        }

        // Get borrows from storage
        const borrows = await Storage.getBorrows() || [];
        const borrowIndex = borrows.findIndex(b => b.id === borrowId);

        if (borrowIndex === -1) {
            Utils.showToast('Borrow record not found', 'error');
            return;
        }

        const borrow = borrows[borrowIndex];
        const totalAmount = parseFloat(borrow.amount) || 0;
        const currentPaid = parseFloat(borrow.paidAmount) || 0;
        const remaining = totalAmount - currentPaid;

        // Check if payment exceeds remaining
        if (amount > remaining) {
            Utils.showToast(`Payment cannot exceed ₹${remaining.toLocaleString('en-IN')}`, 'error');
            return;
        }

        // Initialize payments array if not exists
        if (!borrow.payments) {
            borrow.payments = [];
        }

        // Add payment record
        borrow.payments.push({
            id: Date.now().toString(),
            amount: amount,
            date: date || new Date().toISOString().split('T')[0],
            note: note
        });

        // Update paid amount
        borrow.paidAmount = currentPaid + amount;

        // Update status based on payment
        const newRemaining = totalAmount - borrow.paidAmount;
        if (newRemaining <= 0) {
            borrow.status = 'completed';
        } else if (borrow.paidAmount > 0) {
            borrow.status = 'partial';
        }

        // Save back to storage
        borrows[borrowIndex] = borrow;
        await Storage.saveBorrows(borrows);

        // Close modal
        this.closePaymentModal();

        // Refresh the borrow page
        await this.loadBorrowPage();

        // Show success message
        if (newRemaining <= 0) {
            Utils.showToast(`🎉 Fully paid! Payment of ₹${amount.toLocaleString('en-IN')} recorded.`, 'success');
        } else {
            Utils.showToast(`✅ Payment recorded! Remaining: ₹${newRemaining.toLocaleString('en-IN')}`, 'success');
        }

    } catch (error) {
        console.error('Error saving payment:', error);
        Utils.showToast('Failed to save payment', 'error');
    }
},

// Close payment modal
closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Clear form
    const form = document.getElementById('paymentForm');
    if (form) form.reset();
},

// Close payment modal
closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
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
    // Previous month button
    const prevBtn = document.getElementById('prevMonth');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.loadCalendar();
        });
    }
    
    // Next month button
    const nextBtn = document.getElementById('nextMonth');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.loadCalendar();
        });
    }
},

    // ==================== CALENDAR RENDERING ====================
async renderCalendarDay(date, isCurrentMonth, holidays, transactions) {
    // ✅ FIX: Format date in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    
    // Get Panchang data for Indian mode
    let panchangData = null;
    if (IndianCalendar.mode === 'indian') {
        panchangData = await IndianCalendar.getPanchang(date);
    }
    
    // Check for holidays/festivals
    const dayHolidays = holidays[dateStr] || [];
    const hasHoliday = dayHolidays.some(h => h.type === 'national');
    const hasFestival = dayHolidays.length > 0;
    
    // Check for transactions
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const hasTransactions = dayTransactions.length > 0;
    
    // Build CSS classes
    let classes = ['calendar-day'];
    if (!isCurrentMonth) classes.push('other-month');
    if (isToday) classes.push('today');
    if (isSunday) classes.push('sunday');
    if (hasHoliday) classes.push('holiday');
    else if (hasFestival) classes.push('festival');
    if (IndianCalendar.mode === 'simple') classes.push('simple-mode');
    
    // Build HTML
    let html = `
        <div class="${classes.join(' ')}" data-date="${dateStr}" onclick="App.selectCalendarDay('${dateStr}')">
            <!-- Date Row -->
            <div class="date-row">
                <span class="date-number">${date.getDate()}</span>
                ${panchangData ? `<span class="hindi-date">${panchangData.tithi.number}</span>` : ''}
            </div>
    `;
    
    // Indian mode: Add Panchang info
    if (IndianCalendar.mode === 'indian' && panchangData && isCurrentMonth) {
        html += `
            <div class="panchang-mini">
                <span class="tithi-text">${panchangData.tithi.name}</span>
                <span class="nakshatra-text">${panchangData.nakshatra.symbol} ${panchangData.nakshatra.name.split(' ')[0]}</span>
            </div>
        `;
    }
    
    // Event indicators
    if (dayHolidays.length > 0 || hasTransactions) {
        html += `<div class="event-indicators">`;
        
        // Festival emojis (max 2)
        dayHolidays.slice(0, 2).forEach(h => {
            html += `<span class="event-emoji">${h.image || '📅'}</span>`;
        });
        
        // Event dots for overflow
        if (dayHolidays.length > 2) {
            html += `<span class="event-emoji">+${dayHolidays.length - 2}</span>`;
        }
        
        html += `</div>`;
    }
    
    // Transaction indicator
    if (hasTransactions) {
        html += `<div class="transaction-indicator" title="${dayTransactions.length} transaction(s)"></div>`;
    }
    
    // Moon phase (only for Indian mode on certain days)
    if (IndianCalendar.mode === 'indian' && panchangData && isCurrentMonth) {
        const moonPhase = panchangData.moonPhase;
        if (moonPhase.name === 'Full Moon' || moonPhase.name === 'New Moon') {
            html += `<span class="moon-mini">${moonPhase.emoji}</span>`;
        }
    }
    
    // Festival tooltip
    if (dayHolidays.length > 0) {
        const names = dayHolidays.map(h => h.name).join(', ');
        html += `<div class="festival-tooltip">${names}</div>`;
    }
    
    html += `</div>`;
    
    return html;
},

// Full calendar render
// ==================== CALENDAR FUNCTIONS ====================
async loadCalendar(filter = 'all') {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    // Update month display
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Check calendar mode
    const isIndianMode = typeof IndianCalendar !== 'undefined' && IndianCalendar.mode === 'indian';

    // Show/hide Indian calendar elements
    const indianBar = document.getElementById('indianCalendarBar');
    const holidayFilters = document.getElementById('holidayFilters');
    const calendarLegend = document.getElementById('calendarLegend');

    if (indianBar) indianBar.style.display = isIndianMode ? 'block' : 'none';
    if (holidayFilters) holidayFilters.style.display = isIndianMode ? 'flex' : 'none';
    if (calendarLegend) calendarLegend.style.display = isIndianMode ? 'block' : 'none';

    // Get holidays if in Indian mode
    let holidays = {};
    if (isIndianMode && typeof IndianCalendar !== 'undefined') {
        try {
            holidays = await IndianCalendar.fetchHolidays(year);
            
            // Apply filter
            if (filter !== 'all') {
                const filtered = {};
                Object.entries(holidays).forEach(([date, events]) => {
                    const matchingEvents = events.filter(e => e.type === filter);
                    if (matchingEvents.length > 0) {
                        filtered[date] = matchingEvents;
                    }
                });
                holidays = filtered;
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }

        // Update Panchang quick view
        if (typeof updatePanchangQuickView === 'function') {
            await updatePanchangQuickView();
        }
    }

    // Get transactions for indicators
    let transactions = [];
    try {
        transactions = await Storage.getTransactions();
        if (!Array.isArray(transactions)) transactions = [];
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }

    // Calculate calendar days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDay = firstDayOfMonth.getDay(); // 0 = Sunday
    const totalDays = lastDayOfMonth.getDate();

    // Get previous month's days to fill
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Today's date for highlighting
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;  // ✅ CORRECT 

    let html = '';

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        html += this.renderCalendarCell(date, false, isIndianMode, holidays, transactions, todayStr);
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        html += this.renderCalendarCell(date, true, isIndianMode, holidays, transactions, todayStr);
    }

    // Next month days to fill remaining cells (total 42 cells = 6 rows)
    const totalCells = 42;
    const filledCells = startingDay + totalDays;
    const remainingCells = totalCells - filledCells;

    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        html += this.renderCalendarCell(date, false, isIndianMode, holidays, transactions, todayStr);
    }

    grid.innerHTML = html;
},

// Render single calendar cell
// Render single calendar cell with Panchang data
renderCalendarCell(date, isCurrentMonth, isIndianMode, holidays, transactions, todayStr) {
    const dateStr = formatDateString(date);
    const dayNum = date.getDate();
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isToday = dateStr === todayStr;

    // Get holidays for this date
    const dayHolidays = holidays[dateStr] || [];
    const hasNationalHoliday = dayHolidays.some(h => h.type === 'national');
    const hasFestival = dayHolidays.length > 0;

    // Get transactions for this date
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const hasTransactions = dayTransactions.length > 0;

    // Build CSS classes
    let classes = ['calendar-day'];
    if (!isCurrentMonth) classes.push('other-month');
    if (isToday) classes.push('today');
    if (isSunday) classes.push('sunday');
    if (isSaturday) classes.push('saturday');
    if (hasNationalHoliday) classes.push('holiday');
    else if (hasFestival) classes.push('festival');
    if (!isIndianMode) classes.push('simple-mode');

    // Get Panchang data
    let panchang = null;
    if (isIndianMode && isCurrentMonth && typeof IndianCalendar !== 'undefined') {
        try {
            panchang = IndianCalendar.getPanchangSync(date);
        } catch (e) {
            console.error('Panchang error:', e);
        }
    }

    // Build HTML
    let html = `<div class="${classes.join(' ')}" data-date="${dateStr}" onclick="App.selectCalendarDay('${dateStr}')">`;

    // Date row with Tithi number
    html += `<div class="date-row">`;
    html += `<span class="date-number">${dayNum}</span>`;
    if (panchang && panchang.tithi) {
        html += `<span class="hindi-date">${panchang.tithi.number || ''}</span>`;
    }
    html += `</div>`;

    // Panchang info (Indian mode only, current month only)
    if (isIndianMode && isCurrentMonth && panchang) {
        html += `<div class="panchang-mini">`;
        
        // Tithi name
        if (panchang.tithi) {
            html += `<span class="tithi-text">${panchang.tithi.name || ''}</span>`;
        }
        
        // Nakshatra with symbol
        if (panchang.nakshatra) {
            const nakshatraShort = (panchang.nakshatra.name || '').split(' ')[0];
            html += `<span class="nakshatra-text">${panchang.nakshatra.symbol || '⭐'} ${nakshatraShort}</span>`;
        }
        
        html += `</div>`;
    }

    // Event indicators (festivals, holidays)
    if (isCurrentMonth && (dayHolidays.length > 0 || hasTransactions)) {
        html += `<div class="event-indicators">`;
        
        // Show festival emojis (max 2)
        dayHolidays.slice(0, 2).forEach(h => {
            html += `<span class="event-emoji">${h.image || '📅'}</span>`;
        });
        
        // Show overflow count
        if (dayHolidays.length > 2) {
            html += `<span class="event-overflow">+${dayHolidays.length - 2}</span>`;
        }
        
        html += `</div>`;
    }

    // Transaction indicator dot
    if (hasTransactions && isCurrentMonth) {
        html += `<span class="transaction-dot" title="${dayTransactions.length} transaction(s)"></span>`;
    }

    // Moon phase on Purnima/Amavasya
    if (isIndianMode && isCurrentMonth && panchang && panchang.moonPhase) {
        if (panchang.moonPhase.name === 'Full Moon' || panchang.moonPhase.name === 'New Moon') {
            html += `<span class="moon-mini">${panchang.moonPhase.emoji}</span>`;
        }
    }

    // Tooltip for festivals
    if (dayHolidays.length > 0 && isCurrentMonth) {
        const names = dayHolidays.map(h => h.name).join(', ');
        html += `<div class="festival-tooltip">${names}</div>`;
    }

    html += `</div>`;

    return html;
},

// Simple Panchang fallback (no async)
getSimplePanchang(date) {
    const tithis = [
        'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
        'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
        'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Amavasya'
    ];
    
    // Simple calculation based on moon cycle
    const knownNewMoon = new Date('2024-01-11');
    const daysSince = Math.floor((date - knownNewMoon) / (1000 * 60 * 60 * 24));
    const moonAge = daysSince % 30;
    
    let tithiIndex = Math.floor(moonAge / 2);
    if (tithiIndex > 14) tithiIndex = 15; // Amavasya
    if (moonAge >= 14 && moonAge < 16) tithiIndex = 14; // Purnima
    
    return {
        tithi: tithis[tithiIndex] || 'Pratipada',
        tithiNum: (tithiIndex + 1).toString()
    };
},

// Select calendar day
async selectCalendarDay(dateStr) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection to clicked day
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) {
        dayEl.classList.add('selected');
    }

    // Update day details
    await this.showDayDetails(dateStr);
},

// Show day details in panel
async showDayDetails(dateStr) {
    const isIndianMode = typeof IndianCalendar !== 'undefined' && IndianCalendar.mode === 'indian';
    
    // Update title
    const titleEl = document.getElementById('selectedDateTitle');
    if (titleEl) {
        titleEl.textContent = Utils.formatDate(dateStr, 'long');
    }

    // Show appropriate content
    const simpleContent = document.getElementById('simpleViewContent');
    const indianContent = document.getElementById('indianViewContent');
    
    if (simpleContent) simpleContent.style.display = isIndianMode ? 'none' : 'block';
    if (indianContent) indianContent.style.display = isIndianMode ? 'block' : 'none';

    if (isIndianMode && typeof showDayPanchang === 'function') {
        await showDayPanchang(dateStr);
    }

    // Load transactions for this day
    await this.loadDayTransactions(dateStr);

    // Open panel
    const panel = document.getElementById('dayDetails');
    const overlay = document.getElementById('dayDetailsOverlay');
    
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
},

// Load transactions for selected day
async loadDayTransactions(dateStr) {
    const containerId = IndianCalendar?.mode === 'indian' ? 'indianDayTransactions' : 'dayTransactions';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    try {
        const transactions = await Storage.getTransactions();
        const dayTransactions = Array.isArray(transactions) ? 
            transactions.filter(t => t.date === dateStr) : [];

        if (dayTransactions.length === 0) {
            container.innerHTML = '<p class="empty-message">No transactions on this day</p>';
        } else {
            container.innerHTML = dayTransactions.map(t => `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-info">
                        <span class="description">${t.description}</span>
                        <span class="category">${t.category}</span>
                    </div>
                    <span class="amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                    </span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading day transactions:', error);
        container.innerHTML = '<p class="empty-message">Error loading transactions</p>';
    }
},

// Select calendar day
async selectCalendarDay(dateStr) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked day
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) {
        dayEl.classList.add('selected');
    }
    
    // Show day details panel
    if (IndianCalendar.mode === 'indian') {
        await showDayPanchang(dateStr);
    } else {
        await this.showSimpleDayDetails(dateStr);
    }
    
    // Open panel
    document.getElementById('dayDetails').classList.add('open');
    document.getElementById('dayDetailsOverlay')?.classList.add('open');
},

async showSimpleDayDetails(dateStr) {
    document.getElementById('selectedDateTitle').textContent = 
        Utils.formatDate(dateStr, 'long');
    
    const transactions = await Storage.getTransactions();
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    
    const container = document.getElementById('dayTransactions');
    
    if (dayTransactions.length === 0) {
        container.innerHTML = '<p class="empty-message">No transactions on this day</p>';
    } else {
        container.innerHTML = dayTransactions.map(t => `
            <div class="transaction-item ${t.type}">
                <div class="transaction-info">
                    <span class="description">${t.description}</span>
                    <span class="category">${t.category}</span>
                </div>
                <span class="amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                </span>
            </div>
        `).join('');
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

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
            const totalAmount = parseFloat(item.amount) || 0;
            const paidAmount = parseFloat(item.paidAmount) || 0;
            const remaining = totalAmount - paidAmount;
            const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
            
            // Status calculation
            const isFullyPaid = remaining <= 0;
            const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;
            const isOverdue = item.dueDate && item.dueDate < today && !isFullyPaid;
            
            // Auto-update status based on payment
            let displayStatus = item.status;
            if (isFullyPaid) displayStatus = 'completed';
            else if (isPartiallyPaid) displayStatus = 'partial';
            else displayStatus = 'pending';
            
            const initials = item.person
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

            return `
                <div class="borrow-item ${item.type} ${isOverdue ? "overdue" : ""} ${isFullyPaid ? "completed" : ""} ${isPartiallyPaid ? "partial-paid" : ""}" 
                     style="animation-delay: ${index * 0.1}s">
                    
                    <!-- Status Badge - Top Right -->
                    <div class="borrow-status-tag ${displayStatus}">
                        ${isFullyPaid ? '✅ Paid' : isPartiallyPaid ? `⏳ ${progress.toFixed(0)}% Paid` : '⏳ Pending'}
                    </div>
                    
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
                        
                        <!-- Progress Bar - Always show if partial -->
                        ${paidAmount > 0 ? `
                            <div class="borrow-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill ${isFullyPaid ? 'complete' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                                </div>
                                <span class="progress-text">${progress.toFixed(0)}% paid</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Amount Section - Improved -->
                    <div class="borrow-amount-section">
                        <!-- Total Amount -->
                        <div class="amount-total ${isFullyPaid ? 'strikethrough' : ''}">
                            ${Utils.formatCurrency(totalAmount)}
                        </div>
                        
                        <!-- Paid Amount -->
                        ${paidAmount > 0 ? `
                            <div class="amount-paid">
                                <span class="paid-label">Paid:</span>
                                <span class="paid-value">₹${paidAmount.toLocaleString('en-IN')}</span>
                            </div>
                        ` : ''}
                        
                        <!-- Remaining Amount - Highlighted -->
                        ${!isFullyPaid ? `
                            <div class="amount-remaining ${isPartiallyPaid ? 'highlight' : ''}">
                                <span class="remaining-label">Due:</span>
                                <span class="remaining-value">₹${remaining.toLocaleString('en-IN')}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="borrow-actions-btns">
                        ${!isFullyPaid ? `
                            <button class="borrow-action-btn payment" onclick="App.openPaymentModal('${item.id}')" title="Record Payment">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        ` : ''}
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

// ==================== INDIAN CALENDAR FUNCTIONS ====================

function toggleCalendarMode() {
    const toggle = document.getElementById('calendarModeToggle');
    const mode = toggle.checked ? 'indian' : 'simple';
    
    IndianCalendar.saveMode(mode);
    updateCalendarUI(mode);
    App.loadCalendar();
}

function updateCalendarUI(mode) {
    const indianBar = document.getElementById('indianCalendarBar');
    const holidayFilters = document.getElementById('holidayFilters');
    const calendarLegend = document.getElementById('calendarLegend');
    const simpleContent = document.getElementById('simpleViewContent');
    const indianContent = document.getElementById('indianViewContent');
    
    if (mode === 'indian') {
        indianBar.style.display = 'block';
        holidayFilters.style.display = 'flex';
        calendarLegend.style.display = 'block';
        simpleContent.style.display = 'none';
        indianContent.style.display = 'block';
        
        // Update Panchang quick view
        updatePanchangQuickView();
    } else {
        indianBar.style.display = 'none';
        holidayFilters.style.display = 'none';
        calendarLegend.style.display = 'none';
        simpleContent.style.display = 'block';
        indianContent.style.display = 'none';
    }
}

async function updatePanchangQuickView() {
    const today = new Date();
    const panchang = await IndianCalendar.getPanchang(today);
    
    document.getElementById('currentHinduMonth').textContent = 
        `${panchang.hinduMonth.name} (${panchang.hinduMonth.nameHi})`;
    document.getElementById('currentPaksha').textContent = 
        panchang.paksha.nameHi;
    document.getElementById('currentMoonPhase').textContent = 
        `${panchang.moonPhase.emoji} ${panchang.moonPhase.name}`;
    document.getElementById('currentSeason').textContent = 
        panchang.hinduMonth.season;
}

async function showDayPanchang(dateStr) {
    const date = new Date(dateStr);
    const panchang = await IndianCalendar.getPanchang(date);
    
    // Update title
    document.getElementById('selectedDateTitle').textContent = 
        Utils.formatDate(dateStr, 'long');
    
    // Update Panchang details
    document.getElementById('panchangTithi').textContent = 
        `${panchang.tithi.name} (${panchang.tithi.nameHi})`;
    document.getElementById('panchangNakshatra').textContent = 
        `${panchang.nakshatra.name} (${panchang.nakshatra.nameHi})`;
    document.getElementById('nakshatraSymbol').textContent = 
        panchang.nakshatra.symbol;
    document.getElementById('panchangYoga').textContent = 
        panchang.yoga.name;
    document.getElementById('panchangKaran').textContent = 
        panchang.karan.name;
    
    // Sun & Moon
    document.getElementById('panchangSunrise').textContent = panchang.sunrise;
    document.getElementById('panchangSunset').textContent = panchang.sunset;
    document.getElementById('moonPhaseIcon').textContent = panchang.moonPhase.emoji;
    document.getElementById('panchangMoonPhase').textContent = panchang.moonPhase.name;
    document.getElementById('panchangPaksha').textContent = 
        `${panchang.paksha.name} (${panchang.paksha.nameHi})`;
    
    // Rahu Kaal
    document.getElementById('panchangRahuKaal').textContent = panchang.rahuKaal.time;
    
    // Guidance
    const guidanceEl = document.getElementById('panchangGuidance');
    let guidanceHTML = '';
    
    panchang.auspicious.auspicious.forEach(item => {
        guidanceHTML += `<div class="guidance-item auspicious">${item}</div>`;
    });
    panchang.auspicious.inauspicious.forEach(item => {
        guidanceHTML += `<div class="guidance-item inauspicious">${item}</div>`;
    });
    
    if (!guidanceHTML) {
        guidanceHTML = '<div class="guidance-item auspicious">✨ Regular day - Good for routine activities</div>';
    }
    
    guidanceEl.innerHTML = guidanceHTML;
    
    // Festivals
    const year = date.getFullYear();
    const holidays = await IndianCalendar.fetchHolidays(year);
    const dayHolidays = holidays[dateStr];
    
    const festivalsSection = document.getElementById('dayFestivalsSection');
    const festivalsList = document.getElementById('dayFestivals');
    
    if (dayHolidays && dayHolidays.length > 0) {
        festivalsSection.style.display = 'block';
        festivalsList.innerHTML = dayHolidays.map(h => `
            <div class="festival-card">
                <span class="emoji">${h.image || '📅'}</span>
                <div class="info">
                    <div class="name">${h.name}</div>
                    ${h.description ? `<div class="description">${h.description}</div>` : ''}
                </div>
                <span class="type-badge ${h.type}">${h.type}</span>
            </div>
        `).join('');
    } else {
        festivalsSection.style.display = 'none';
    }
}

function filterHolidays(filter) {
    // Update active filter
    document.querySelectorAll('.holiday-filters .filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    // Re-render calendar with filter
    App.loadCalendar(filter);
}


// ==================== CALENDAR HELPER FUNCTIONS ====================

// Toggle calendar mode
function toggleCalendarMode() {
    const toggle = document.getElementById('calendarModeToggle');
    if (!toggle) return;
    
    const mode = toggle.checked ? 'indian' : 'simple';
    
    if (typeof IndianCalendar !== 'undefined') {
        IndianCalendar.mode = mode;
        localStorage.setItem('calendarMode', mode);
    }
    
    // Reload calendar
    if (typeof App !== 'undefined' && App.loadCalendar) {
        App.loadCalendar();
    }
}

// Update Panchang quick view bar
async function updatePanchangQuickView() {
    if (typeof IndianCalendar === 'undefined') return;
    
    const today = new Date();
    
    try {
        const panchang = await IndianCalendar.getPanchang(today);
        
        const hinduMonthEl = document.getElementById('currentHinduMonth');
        const pakshaEl = document.getElementById('currentPaksha');
        const moonPhaseEl = document.getElementById('currentMoonPhase');
        const seasonEl = document.getElementById('currentSeason');
        
        if (hinduMonthEl && panchang.hinduMonth) {
            hinduMonthEl.textContent = `${panchang.hinduMonth.name} (${panchang.hinduMonth.nameHi})`;
        }
        if (pakshaEl && panchang.paksha) {
            pakshaEl.textContent = panchang.paksha.nameHi || panchang.paksha.name;
        }
        if (moonPhaseEl && panchang.moonPhase) {
            moonPhaseEl.textContent = `${panchang.moonPhase.emoji} ${panchang.moonPhase.name}`;
        }
        if (seasonEl && panchang.hinduMonth) {
            seasonEl.textContent = panchang.hinduMonth.season;
        }
    } catch (error) {
        console.error('Error updating Panchang view:', error);
    }
}

// Show detailed Panchang for selected day
async function showDayPanchang(dateStr) {
    if (typeof IndianCalendar === 'undefined') return;
    
    const date = new Date(dateStr);
    
    try {
        const panchang = await IndianCalendar.getPanchang(date);
        
        // Update Panchang details
        const tithiEl = document.getElementById('panchangTithi');
        const nakshatraEl = document.getElementById('panchangNakshatra');
        const yogaEl = document.getElementById('panchangYoga');
        const karanEl = document.getElementById('panchangKaran');
        const sunriseEl = document.getElementById('panchangSunrise');
        const sunsetEl = document.getElementById('panchangSunset');
        const moonPhaseEl = document.getElementById('panchangMoonPhase');
        const moonIconEl = document.getElementById('moonPhaseIcon');
        const pakshaEl = document.getElementById('panchangPaksha');
        const rahuKaalEl = document.getElementById('panchangRahuKaal');
        const guidanceEl = document.getElementById('panchangGuidance');
        const nakshatraSymbol = document.getElementById('nakshatraSymbol');
        
        if (tithiEl && panchang.tithi) {
            tithiEl.textContent = `${panchang.tithi.name} (${panchang.tithi.nameHi || ''})`;
        }
        if (nakshatraEl && panchang.nakshatra) {
            nakshatraEl.textContent = `${panchang.nakshatra.name} (${panchang.nakshatra.nameHi || ''})`;
        }
        if (nakshatraSymbol && panchang.nakshatra) {
            nakshatraSymbol.textContent = panchang.nakshatra.symbol || '⭐';
        }
        if (yogaEl && panchang.yoga) {
            yogaEl.textContent = panchang.yoga.name;
        }
        if (karanEl && panchang.karan) {
            karanEl.textContent = panchang.karan.name;
        }
        if (sunriseEl) {
            sunriseEl.textContent = panchang.sunrise || '6:00 AM';
        }
        if (sunsetEl) {
            sunsetEl.textContent = panchang.sunset || '6:00 PM';
        }
        if (moonPhaseEl && panchang.moonPhase) {
            moonPhaseEl.textContent = panchang.moonPhase.name;
        }
        if (moonIconEl && panchang.moonPhase) {
            moonIconEl.textContent = panchang.moonPhase.emoji || '🌙';
        }
        if (pakshaEl && panchang.paksha) {
            pakshaEl.textContent = `${panchang.paksha.name} (${panchang.paksha.nameHi || ''})`;
        }
        if (rahuKaalEl && panchang.rahuKaal) {
            rahuKaalEl.textContent = panchang.rahuKaal.time || '-';
        }
        
        // Guidance
        if (guidanceEl && panchang.auspicious) {
            let guidanceHTML = '';
            
            if (panchang.auspicious.auspicious) {
                panchang.auspicious.auspicious.forEach(item => {
                    guidanceHTML += `<div class="guidance-item auspicious">${item}</div>`;
                });
            }
            if (panchang.auspicious.inauspicious) {
                panchang.auspicious.inauspicious.forEach(item => {
                    guidanceHTML += `<div class="guidance-item inauspicious">${item}</div>`;
                });
            }
            
            if (!guidanceHTML) {
                guidanceHTML = '<div class="guidance-item auspicious">✨ Good day for regular activities</div>';
            }
            
            guidanceEl.innerHTML = guidanceHTML;
        }
        
        // Festivals
        const year = date.getFullYear();
        const holidays = await IndianCalendar.fetchHolidays(year);
        const dayHolidays = holidays[dateStr];
        
        const festivalsSection = document.getElementById('dayFestivalsSection');
        const festivalsList = document.getElementById('dayFestivals');
        
        if (festivalsSection && festivalsList) {
            if (dayHolidays && dayHolidays.length > 0) {
                festivalsSection.style.display = 'block';
                festivalsList.innerHTML = dayHolidays.map(h => `
                    <div class="festival-card">
                        <span class="emoji">${h.image || '📅'}</span>
                        <div class="info">
                            <div class="name">${h.name}</div>
                            ${h.description ? `<div class="description">${h.description}</div>` : ''}
                        </div>
                        <span class="type-badge ${h.type}">${h.type}</span>
                    </div>
                `).join('');
            } else {
                festivalsSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error showing day Panchang:', error);
    }
}

// Filter holidays by type
function filterHolidays(filter) {
    // Update active filter button
    document.querySelectorAll('.holiday-filters .filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    // Reload calendar with filter
    if (typeof App !== 'undefined' && App.loadCalendar) {
        App.loadCalendar(filter);
    }
}

// Close day details panel
function closeDayDetails() {
    const panel = document.getElementById('dayDetails');
    const overlay = document.getElementById('dayDetailsOverlay');

    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    // Remove selection from calendar
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

// Make it globally available
window.closeDayDetails = closeDayDetails;

// Initialize calendar mode on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedMode = localStorage.getItem('calendarMode') || 'simple';
    
    if (typeof IndianCalendar !== 'undefined') {
        IndianCalendar.mode = savedMode;
    }
    
    const toggle = document.getElementById('calendarModeToggle');
    if (toggle) {
        toggle.checked = savedMode === 'indian';
    }
});

// ==================== CALENDAR - COMPLETE REWRITE ====================

// Initialize calendar date
if (!App.currentCalendarDate) {
    App.currentCalendarDate = new Date();
}

// Load and render calendar
App.loadCalendar = async function(filter = 'all') {
    const grid = document.getElementById('calendarGrid');
    if (!grid) {
        console.error('Calendar grid not found');
        return;
    }

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    // Update month display
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Check if Indian mode
    const isIndian = window.IndianCalendar && window.IndianCalendar.mode === 'indian';
    console.log('Rendering calendar, Indian mode:', isIndian);

    // Show/hide Indian elements
    const indianBar = document.getElementById('indianCalendarBar');
    const holidayFilters = document.getElementById('holidayFilters');
    const calendarLegend = document.getElementById('calendarLegend');

    if (indianBar) indianBar.style.display = isIndian ? 'block' : 'none';
    if (holidayFilters) holidayFilters.style.display = isIndian ? 'flex' : 'none';
    if (calendarLegend) calendarLegend.style.display = isIndian ? 'block' : 'none';

    // Update Panchang bar
    if (isIndian) {
        this.updatePanchangBar();
    }

    // Get transactions
    let transactions = [];
    try {
        const allTrans = await Storage.getTransactions();
        transactions = Array.isArray(allTrans) ? allTrans : [];
    } catch (e) {
        console.error('Error loading transactions:', e);
    }

    // Calculate calendar
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let html = '';

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const date = new Date(year, month - 1, day);
        html += this.renderDayCell(date, false, isIndian, transactions, todayStr);
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        html += this.renderDayCell(date, true, isIndian, transactions, todayStr);
    }

    // Next month days
    const cellsFilled = startDay + totalDays;
    const remaining = 42 - cellsFilled;
    for (let day = 1; day <= remaining; day++) {
        const date = new Date(year, month + 1, day);
        html += this.renderDayCell(date, false, isIndian, transactions, todayStr);
    }

    grid.innerHTML = html;
    console.log('Calendar rendered with', 42, 'cells');
};

// Render a single day cell
App.renderDayCell = function(date, isCurrentMonth, isIndian, transactions, todayStr) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayNum = date.getDate();
    const dayOfWeek = date.getDay();
    const isToday = dateStr === todayStr;
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    // Transactions for this day
    const dayTrans = transactions.filter(t => t.date === dateStr);
    const hasTrans = dayTrans.length > 0;

    // Get Panchang data
    let panchang = null;
    if (isIndian && isCurrentMonth && window.IndianCalendar) {
        panchang = window.IndianCalendar.getPanchang(date);
    }

    // CSS classes
    let cls = 'calendar-day';
    if (!isCurrentMonth) cls += ' other-month';
    if (isToday) cls += ' today';
    if (isSunday) cls += ' sunday';
    if (isSaturday) cls += ' saturday';
    if (!isIndian) cls += ' simple-mode';

    // Build HTML
    let html = `<div class="${cls}" data-date="${dateStr}" onclick="App.selectCalendarDay('${dateStr}')">`;

    // Row 1: Date + Tithi number
    html += `<div class="date-row">`;
    html += `<span class="date-number">${dayNum}</span>`;
    if (panchang && panchang.tithi) {
        html += `<span class="hindi-date">${panchang.tithi.num}</span>`;
    }
    html += `</div>`;

    // Row 2: Tithi & Nakshatra (Indian mode only)
    if (isIndian && isCurrentMonth && panchang) {
        html += `<div class="panchang-mini">`;
        if (panchang.tithi) {
            html += `<div class="tithi-text">${panchang.tithi.name}</div>`;
        }
        if (panchang.nakshatra) {
            html += `<div class="nakshatra-text">${panchang.nakshatra.symbol} ${panchang.nakshatra.name}</div>`;
        }
        html += `</div>`;

        // Moon on special days
        if (panchang.tithi.name === 'Purnima') {
            html += `<span class="moon-mini">🌕</span>`;
        } else if (panchang.tithi.name === 'Amavasya') {
            html += `<span class="moon-mini">🌑</span>`;
        }
    }

    // Transaction indicator
    if (hasTrans && isCurrentMonth) {
        html += `<span class="transaction-dot"></span>`;
    }

    html += `</div>`;
    return html;
};

// Update Panchang bar
App.updatePanchangBar = function() {
    if (!window.IndianCalendar) return;

    const today = new Date();
    const panchang = window.IndianCalendar.getPanchang(today);

    const monthEl = document.getElementById('currentHinduMonth');
    const pakshaEl = document.getElementById('currentPaksha');
    const moonEl = document.getElementById('currentMoonPhase');
    const seasonEl = document.getElementById('currentSeason');

    if (monthEl && panchang.hinduMonth) {
        monthEl.textContent = `${panchang.hinduMonth.name} (${panchang.hinduMonth.nameHi})`;
    }
    if (pakshaEl && panchang.paksha) {
        pakshaEl.textContent = panchang.paksha.nameHi;
    }
    if (moonEl && panchang.moonPhase) {
        moonEl.textContent = `${panchang.moonPhase.emoji} ${panchang.moonPhase.name}`;
    }
    if (seasonEl && panchang.hinduMonth) {
        seasonEl.textContent = panchang.hinduMonth.season;
    }
};

// Select a day
// ==================== SELECT CALENDAR DAY - COMPLETE FIX ====================
// ==================== SELECT CALENDAR DAY - TIMEZONE FIXED ====================
App.selectCalendarDay = async function(dateStr) {
    console.log('Selected date:', dateStr);
    
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection to clicked day
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) {
        dayEl.classList.add('selected');
    }

    // Get panel elements
    const panel = document.getElementById('dayDetails');
    const overlay = document.getElementById('dayDetailsOverlay');
    
    if (!panel) {
        console.error('Day details panel not found!');
        return;
    }

    // Open panel
    panel.classList.add('open');
    if (overlay) overlay.classList.add('open');

    // ✅ FIX: Parse date correctly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    const isIndian = window.IndianCalendar && window.IndianCalendar.mode === 'indian';
    
    // Format date for title
    const weekday = date.toLocaleDateString('en-IN', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-IN', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric' 
    });

    console.log('Parsed date:', date.toDateString()); // Debug log

    // Build content HTML directly
    let contentHTML = '';
    
    if (isIndian && window.IndianCalendar) {
        // Get Panchang data
        const panchang = window.IndianCalendar.getPanchang(date);
        const dayOfWeek = date.getDay();
        
        // Rahu Kaal times
        const rahuKaal = [
            '4:30 PM - 6:00 PM',  // Sunday
            '7:30 AM - 9:00 AM',  // Monday
            '3:00 PM - 4:30 PM',  // Tuesday
            '12:00 PM - 1:30 PM', // Wednesday
            '1:30 PM - 3:00 PM',  // Thursday
            '10:30 AM - 12:00 PM',// Friday
            '9:00 AM - 10:30 AM'  // Saturday
        ];

        // Sunrise/Sunset by month
        const monthIndex = date.getMonth();
        const sunrise = ['6:50', '6:40', '6:20', '5:55', '5:30', '5:25', '5:35', '5:50', '6:05', '6:20', '6:40', '6:55'][monthIndex];
        const sunset = ['5:40', '6:05', '6:25', '6:45', '7:05', '7:15', '7:10', '6:50', '6:20', '5:50', '5:25', '5:20'][monthIndex];

        // Yoga calculation
        const yogas = ['Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const yoga = yogas[(dayOfYear + date.getFullYear()) % 27];

        // Karan calculation
        const karans = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];
        const karan = karans[(dayOfYear * 2) % 7];

        // Build guidance
        let guidance = '';
        if (panchang.tithi.name === 'Ekadashi') {
            guidance += '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;margin-bottom:6px;">🙏 Ekadashi - Excellent for fasting</div>';
        }
        if (panchang.tithi.name === 'Purnima') {
            guidance += '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;margin-bottom:6px;">✨ Purnima - Very auspicious day</div>';
        }
        if (panchang.tithi.name === 'Amavasya') {
            guidance += '<div style="background:#fee2e2;color:#991b1b;padding:8px 12px;border-radius:8px;margin-bottom:6px;">⚠️ Amavasya - Avoid new beginnings</div>';
        }
        if (dayOfWeek === 2) {
            guidance += '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;margin-bottom:6px;">🔱 Tuesday - Good for Hanuman worship</div>';
        }
        if (dayOfWeek === 4) {
            guidance += '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;margin-bottom:6px;">🙏 Thursday - Good for Guru worship</div>';
        }
        if (dayOfWeek === 6) {
            guidance += '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;margin-bottom:6px;">🪔 Saturday - Good for Shani worship</div>';
        }
        if (!guidance) {
            guidance = '<div style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:8px;">✨ Good day for regular activities</div>';
        }

        contentHTML = `
            <!-- Hindu Month -->
            <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;padding:15px;text-align:center;margin-bottom:15px;">
                <div style="font-size:1.1rem;font-weight:700;color:#78350f;">
                    ${panchang.hinduMonth.name} 
                    <span style="color:#92400e;">(${panchang.hinduMonth.nameHi})</span>
                </div>
                <div style="font-size:0.8rem;color:#a16207;margin-top:4px;">${panchang.hinduMonth.season}</div>
            </div>

            <!-- Panchang -->
            <div style="background:#f8fafc;border-radius:12px;padding:15px;margin-bottom:15px;">
                <h4 style="margin:0 0 12px;font-size:0.9rem;color:#374151;">📅 Panchang</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div style="background:white;padding:10px;border-radius:8px;">
                        <div style="font-size:0.7rem;color:#64748b;">Tithi</div>
                        <div style="font-weight:600;color:#1f2937;">${panchang.tithi.name}</div>
                        <div style="font-size:0.75rem;color:#f97316;">${panchang.tithi.nameHi}</div>
                    </div>
                    <div style="background:white;padding:10px;border-radius:8px;">
                        <div style="font-size:0.7rem;color:#64748b;">Nakshatra</div>
                        <div style="font-weight:600;color:#1f2937;">${panchang.nakshatra.symbol} ${panchang.nakshatra.name}</div>
                        <div style="font-size:0.75rem;color:#7c3aed;">${panchang.nakshatra.nameHi}</div>
                    </div>
                    <div style="background:white;padding:10px;border-radius:8px;">
                        <div style="font-size:0.7rem;color:#64748b;">Yoga</div>
                        <div style="font-weight:600;color:#1f2937;">🧘 ${yoga}</div>
                    </div>
                    <div style="background:white;padding:10px;border-radius:8px;">
                        <div style="font-size:0.7rem;color:#64748b;">Karan</div>
                        <div style="font-weight:600;color:#1f2937;">⚡ ${karan}</div>
                    </div>
                </div>
            </div>

            <!-- Sun & Moon -->
            <div style="background:#f8fafc;border-radius:12px;padding:15px;margin-bottom:15px;">
                <h4 style="margin:0 0 12px;font-size:0.9rem;color:#374151;">🌅 Sun & Moon</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div style="background:linear-gradient(135deg,#fef9c3,#fef08a);padding:12px;border-radius:8px;text-align:center;">
                        <div style="font-size:1.3rem;">🌅</div>
                        <div style="font-size:0.7rem;color:#64748b;">Sunrise</div>
                        <div style="font-weight:600;">${sunrise} AM</div>
                    </div>
                    <div style="background:linear-gradient(135deg,#fed7aa,#fdba74);padding:12px;border-radius:8px;text-align:center;">
                        <div style="font-size:1.3rem;">🌇</div>
                        <div style="font-size:0.7rem;color:#64748b;">Sunset</div>
                        <div style="font-weight:600;">${sunset} PM</div>
                    </div>
                    <div style="background:linear-gradient(135deg,#e0e7ff,#c7d2fe);padding:12px;border-radius:8px;text-align:center;">
                        <div style="font-size:1.3rem;">${panchang.moonPhase.emoji}</div>
                        <div style="font-size:0.7rem;color:#64748b;">Moon Phase</div>
                        <div style="font-weight:600;">${panchang.moonPhase.name}</div>
                    </div>
                    <div style="background:linear-gradient(135deg,#f3e8ff,#e9d5ff);padding:12px;border-radius:8px;text-align:center;">
                        <div style="font-size:1.3rem;">🌓</div>
                        <div style="font-size:0.7rem;color:#64748b;">Paksha</div>
                        <div style="font-weight:600;">${panchang.paksha.nameHi}</div>
                    </div>
                </div>
            </div>

            <!-- Rahu Kaal -->
            <div style="background:linear-gradient(135deg,#fee2e2,#fecaca);border-radius:12px;padding:15px;margin-bottom:15px;display:flex;align-items:center;gap:12px;">
                <span style="font-size:1.5rem;">⛔</span>
                <div>
                    <div style="font-size:0.75rem;color:#991b1b;">Rahu Kaal - Avoid important work</div>
                    <div style="font-size:1.1rem;font-weight:700;color:#dc2626;">${rahuKaal[dayOfWeek]}</div>
                </div>
            </div>

            <!-- Guidance -->
            <div style="background:#f8fafc;border-radius:12px;padding:15px;margin-bottom:15px;">
                <h4 style="margin:0 0 12px;font-size:0.9rem;color:#374151;">✨ Guidance</h4>
                ${guidance}
            </div>
        `;
    }

    // Add transactions section
    let transHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No transactions on this day</p>';
    
    try {
        const transactions = await Storage.getTransactions();
        const dayTrans = Array.isArray(transactions) ? transactions.filter(t => t.date === dateStr) : [];
        
        if (dayTrans.length > 0) {
            let income = 0, expense = 0;
            const items = dayTrans.map(t => {
                if (t.type === 'income') income += parseFloat(t.amount);
                else expense += parseFloat(t.amount);
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:6px;border-left:3px solid ${t.type === 'income' ? '#10b981' : '#ef4444'};">
                        <div>
                            <div style="font-weight:500;">${t.description || 'No description'}</div>
                            <div style="font-size:0.75rem;color:#64748b;">${t.category || ''}</div>
                        </div>
                        <div style="font-weight:600;color:${t.type === 'income' ? '#10b981' : '#ef4444'};">
                            ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                        </div>
                    </div>
                `;
            }).join('');

            transHTML = `
                <div style="display:flex;gap:10px;margin-bottom:12px;">
                    <div style="flex:1;background:#dcfce7;padding:10px;border-radius:8px;text-align:center;">
                        <div style="font-size:0.7rem;color:#64748b;">Income</div>
                        <div style="font-weight:700;color:#10b981;">+${Utils.formatCurrency(income)}</div>
                    </div>
                    <div style="flex:1;background:#fee2e2;padding:10px;border-radius:8px;text-align:center;">
                        <div style="font-size:0.7rem;color:#64748b;">Expense</div>
                        <div style="font-weight:700;color:#ef4444;">-${Utils.formatCurrency(expense)}</div>
                    </div>
                </div>
                ${items}
            `;
        }
    } catch (e) {
        console.error('Error loading transactions:', e);
    }

    contentHTML += `
        <div style="background:#f8fafc;border-radius:12px;padding:15px;">
            <h4 style="margin:0 0 12px;font-size:0.9rem;color:#374151;">💰 Transactions</h4>
            ${transHTML}
        </div>
    `;

    // Set panel content
    panel.innerHTML = `
        <div style="position:sticky;top:0;background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:20px;display:flex;justify-content:space-between;align-items:center;z-index:10;">
            <div>
                <div style="font-weight:600;font-size:1.1rem;">${weekday}</div>
                <div style="font-size:0.9rem;opacity:0.9;">${formattedDate}</div>
            </div>
            <button onclick="closeDayDetails()" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;font-size:1.2rem;">✕</button>
        </div>
        <div style="padding:15px;">
            ${contentHTML}
        </div>
    `;

    console.log('Sidebar loaded for:', date.toDateString());
};

// Close sidebar
function closeDayDetails() {
    const panel = document.getElementById('dayDetails');
    const overlay = document.getElementById('dayDetailsOverlay');
    
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

// Make globally available
window.closeDayDetails = closeDayDetails;

// Initialize calendar events
App.initCalendar = function() {
    // Month navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.loadCalendar();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.loadCalendar();
        };
    }

    // Mode toggle
    const toggle = document.getElementById('calendarModeToggle');
    if (toggle) {
        // Set initial state
        toggle.checked = window.IndianCalendar?.mode === 'indian';

        toggle.onchange = () => {
            const mode = toggle.checked ? 'indian' : 'simple';
            if (window.IndianCalendar) {
                window.IndianCalendar.setMode(mode);
            }
            this.loadCalendar();
        };
    }
};

// ==================== LOAD COMPLETE DAY DETAILS ====================
async function loadDayDetails(dateStr) {
    const date = new Date(dateStr);
    const isIndian = window.IndianCalendar && window.IndianCalendar.mode === 'indian';

    // Update title with formatted date
    const titleEl = document.getElementById('selectedDateTitle');
    if (titleEl) {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { 
            day: 'numeric',
            month: 'long', 
            year: 'numeric' 
        });
        titleEl.innerHTML = `<div>${weekday}</div><div style="font-size: 0.85rem; color: #64748b;">${formattedDate}</div>`;
    }

    // Show correct view based on mode
    const simpleContent = document.getElementById('simpleViewContent');
    const indianContent = document.getElementById('indianViewContent');

    if (simpleContent) simpleContent.style.display = isIndian ? 'none' : 'block';
    if (indianContent) indianContent.style.display = isIndian ? 'block' : 'none';

    // Load Panchang details for Indian mode
    if (isIndian && window.IndianCalendar) {
        const panchang = window.IndianCalendar.getPanchang(date);

        // Tithi
        const tithiEl = document.getElementById('panchangTithi');
        if (tithiEl && panchang.tithi) {
            tithiEl.innerHTML = `
                <strong>${panchang.tithi.name}</strong>
                <span style="color: #f97316; font-size: 0.8rem;"> (${panchang.tithi.nameHi})</span>
            `;
        }

        // Nakshatra
        const nakshatraEl = document.getElementById('panchangNakshatra');
        const nakshatraSymbol = document.getElementById('nakshatraSymbol');
        if (nakshatraEl && panchang.nakshatra) {
            nakshatraEl.innerHTML = `
                <strong>${panchang.nakshatra.name}</strong>
                <span style="color: #7c3aed; font-size: 0.8rem;"> (${panchang.nakshatra.nameHi})</span>
            `;
        }
        if (nakshatraSymbol && panchang.nakshatra) {
            nakshatraSymbol.textContent = panchang.nakshatra.symbol || '⭐';
        }

        // Yoga
        const yogaEl = document.getElementById('panchangYoga');
        if (yogaEl) {
            const yogas = ['Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
            const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            const yogaIndex = (dayOfYear + date.getFullYear()) % 27;
            yogaEl.textContent = yogas[yogaIndex] || 'Shubha';
        }

        // Karan
        const karanEl = document.getElementById('panchangKaran');
        if (karanEl) {
            const karans = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'];
            const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            const karanIndex = (dayOfYear * 2) % 11;
            karanEl.textContent = karans[karanIndex] || 'Bava';
        }

        // Moon Phase
        const moonPhaseEl = document.getElementById('panchangMoonPhase');
        const moonIconEl = document.getElementById('moonPhaseIcon');
        if (moonPhaseEl && panchang.moonPhase) {
            moonPhaseEl.textContent = panchang.moonPhase.name;
        }
        if (moonIconEl && panchang.moonPhase) {
            moonIconEl.textContent = panchang.moonPhase.emoji;
        }

        // Paksha
        const pakshaEl = document.getElementById('panchangPaksha');
        if (pakshaEl && panchang.paksha) {
            pakshaEl.innerHTML = `${panchang.paksha.name} <span style="color: #7c3aed;">(${panchang.paksha.nameHi})</span>`;
        }

        // Sunrise & Sunset (approximate based on month)
        const sunriseEl = document.getElementById('panchangSunrise');
        const sunsetEl = document.getElementById('panchangSunset');
        const month = date.getMonth();
        const sunriseData = ['6:50 AM', '6:40 AM', '6:20 AM', '5:55 AM', '5:30 AM', '5:25 AM', '5:35 AM', '5:50 AM', '6:05 AM', '6:20 AM', '6:40 AM', '6:55 AM'];
        const sunsetData = ['5:40 PM', '6:05 PM', '6:25 PM', '6:45 PM', '7:05 PM', '7:15 PM', '7:10 PM', '6:50 PM', '6:20 PM', '5:50 PM', '5:25 PM', '5:20 PM'];
        if (sunriseEl) sunriseEl.textContent = sunriseData[month];
        if (sunsetEl) sunsetEl.textContent = sunsetData[month];

        // Rahu Kaal
        const rahuKaalEl = document.getElementById('panchangRahuKaal');
        const dayOfWeek = date.getDay();
        const rahuKaal = [
            '4:30 PM - 6:00 PM',  // Sunday
            '7:30 AM - 9:00 AM',  // Monday
            '3:00 PM - 4:30 PM',  // Tuesday
            '12:00 PM - 1:30 PM', // Wednesday
            '1:30 PM - 3:00 PM',  // Thursday
            '10:30 AM - 12:00 PM',// Friday
            '9:00 AM - 10:30 AM'  // Saturday
        ];
        if (rahuKaalEl) rahuKaalEl.textContent = rahuKaal[dayOfWeek];

        // Auspicious/Inauspicious guidance
        const guidanceEl = document.getElementById('panchangGuidance');
        if (guidanceEl) {
            let guidance = '';
            
            // Ekadashi
            if (panchang.tithi.name === 'Ekadashi') {
                guidance += '<div class="guidance-item auspicious">🙏 Ekadashi - Excellent for fasting & prayers</div>';
            }
            // Purnima
            if (panchang.tithi.name === 'Purnima') {
                guidance += '<div class="guidance-item auspicious">✨ Purnima - Very auspicious day</div>';
            }
            // Amavasya
            if (panchang.tithi.name === 'Amavasya') {
                guidance += '<div class="guidance-item inauspicious">⚠️ Amavasya - Avoid new beginnings</div>';
                guidance += '<div class="guidance-item auspicious">🙏 Good for Pitru Tarpan</div>';
            }
            // Tuesday
            if (dayOfWeek === 2) {
                guidance += '<div class="guidance-item auspicious">🔱 Tuesday - Good for Hanuman worship</div>';
            }
            // Saturday
            if (dayOfWeek === 6) {
                guidance += '<div class="guidance-item auspicious">🪔 Saturday - Good for Shani worship</div>';
            }
            // Thursday
            if (dayOfWeek === 4) {
                guidance += '<div class="guidance-item auspicious">🙏 Thursday - Good for Guru worship</div>';
            }
            
            if (!guidance) {
                guidance = '<div class="guidance-item auspicious">✨ Good day for regular activities</div>';
            }
            
            guidanceEl.innerHTML = guidance;
        }

        // Hindu Month Info
        const hinduMonthEl = document.getElementById('panchangHinduMonth');
        if (hinduMonthEl && panchang.hinduMonth) {
            hinduMonthEl.innerHTML = `
                <strong>${panchang.hinduMonth.name}</strong> 
                <span style="color: #f97316;">(${panchang.hinduMonth.nameHi})</span>
                <br><small style="color: #64748b;">${panchang.hinduMonth.season}</small>
            `;
        }
    }

    // Load transactions for this day
    try {
        const transactions = await Storage.getTransactions();
        const dayTrans = Array.isArray(transactions) 
            ? transactions.filter(t => t.date === dateStr) 
            : [];

        const containerId = isIndian ? 'indianDayTransactions' : 'dayTransactions';
        const container = document.getElementById(containerId);

        if (container) {
            if (dayTrans.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📝</span>
                        <p>No transactions on this day</p>
                        <button class="add-transaction-btn" onclick="App.openTransactionModal()">
                            + Add Transaction
                        </button>
                    </div>
                `;
            } else {
                let totalIncome = 0;
                let totalExpense = 0;
                
                const transHTML = dayTrans.map(t => {
                    if (t.type === 'income') totalIncome += parseFloat(t.amount);
                    else totalExpense += parseFloat(t.amount);
                    
                    return `
                        <div class="transaction-item ${t.type}">
                            <div class="trans-left">
                                <span class="trans-icon">${t.type === 'income' ? '💰' : '💸'}</span>
                                <div class="trans-info">
                                    <span class="trans-desc">${t.description || 'No description'}</span>
                                    <span class="trans-cat">${t.category || 'Uncategorized'}</span>
                                </div>
                            </div>
                            <span class="trans-amount ${t.type}">
                                ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                            </span>
                        </div>
                    `;
                }).join('');

                container.innerHTML = `
                    <div class="day-summary">
                        <div class="summary-item income">
                            <span class="label">Income</span>
                            <span class="value">+${Utils.formatCurrency(totalIncome)}</span>
                        </div>
                        <div class="summary-item expense">
                            <span class="label">Expense</span>
                            <span class="value">-${Utils.formatCurrency(totalExpense)}</span>
                        </div>
                    </div>
                    <div class="transactions-list">
                        ${transHTML}
                    </div>
                `;
            }
        }
    } catch (e) {
        console.error('Error loading day transactions:', e);
    }
}

// Make it globally available
window.loadDayDetails = loadDayDetails;

// ==================== DATE HELPER - TIMEZONE FIX ====================
function formatDateString(date) {
    // Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateString(dateStr) {
    // Parse YYYY-MM-DD string to local Date object
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid edge cases
}

// Render single borrow/lend card with partial payment support
function renderBorrowCard(borrow) {
    const totalAmount = parseFloat(borrow.amount) || 0;
    const paidAmount = parseFloat(borrow.paidAmount) || 0;
    const remainingAmount = totalAmount - paidAmount;
    const isFullyPaid = remainingAmount <= 0;
    const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;
    const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    
    // Determine card type
    const isGiven = borrow.type === 'given' || borrow.type === 'lent';
    const typeLabel = isGiven ? 'Given to' : 'Taken from';
    const typeClass = isGiven ? 'given' : 'taken';
    
    // Status class
    let statusClass = '';
    let statusLabel = '';
    if (isFullyPaid) {
        statusClass = 'fully-paid';
        statusLabel = '✅ Fully Paid';
    } else if (isPartiallyPaid) {
        statusClass = 'partially-paid';
        statusLabel = `⏳ Partial (${paymentPercentage.toFixed(0)}%)`;
    } else {
        statusClass = 'pending';
        statusLabel = '⏳ Pending';
    }
    
    // Format dates
    const borrowDate = borrow.date ? new Date(borrow.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : '-';
    
    const dueDate = borrow.dueDate ? new Date(borrow.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : 'No due date';
    
    // Check if overdue
    const isOverdue = borrow.dueDate && new Date(borrow.dueDate) < new Date() && !isFullyPaid;
    
    return `
        <div class="borrow-card ${typeClass} ${statusClass} ${isOverdue ? 'overdue' : ''}" data-id="${borrow.id}">
            <!-- Status Badge -->
            <div class="borrow-status-badge ${statusClass}">
                ${statusLabel}
            </div>
            
            <!-- Header -->
            <div class="borrow-header">
                <div class="borrow-person">
                    <span class="person-avatar">${(borrow.personName || 'U')[0].toUpperCase()}</span>
                    <div class="person-info">
                        <span class="person-name">${borrow.personName || 'Unknown'}</span>
                        <span class="borrow-type-label">${typeLabel}</span>
                    </div>
                </div>
                <div class="borrow-actions">
                    ${!isFullyPaid ? `
                        <button class="btn-icon btn-payment" onclick="openPartialPaymentModal('${borrow.id}')" title="Add Payment">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon btn-edit" onclick="editBorrow('${borrow.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteBorrow('${borrow.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <!-- Amount Section -->
            <div class="borrow-amount-section">
                <div class="amount-row">
                    <span class="amount-label">Total Amount</span>
                    <span class="amount-value total">${Utils.formatCurrency(totalAmount)}</span>
                </div>
                ${paidAmount > 0 ? `
                    <div class="amount-row paid">
                        <span class="amount-label">Paid Amount</span>
                        <span class="amount-value paid-amount">- ${Utils.formatCurrency(paidAmount)}</span>
                    </div>
                ` : ''}
                <div class="amount-row remaining ${isFullyPaid ? 'zero' : 'highlight'}">
                    <span class="amount-label">Remaining</span>
                    <span class="amount-value remaining-amount">${Utils.formatCurrency(remainingAmount)}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="payment-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${isFullyPaid ? 'complete' : ''}" style="width: ${paymentPercentage}%"></div>
                    </div>
                    <span class="progress-text">${paymentPercentage.toFixed(0)}% paid</span>
                </div>
            </div>
            
            <!-- Details -->
            <div class="borrow-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>Borrowed: ${borrowDate}</span>
                </div>
                <div class="detail-item ${isOverdue ? 'overdue-text' : ''}">
                    <i class="fas fa-clock"></i>
                    <span>Due: ${dueDate} ${isOverdue ? '(Overdue!)' : ''}</span>
                </div>
                ${borrow.description ? `
                    <div class="detail-item">
                        <i class="fas fa-sticky-note"></i>
                        <span>${borrow.description}</span>
                    </div>
                ` : ''}
            </div>
            
            <!-- Payment History (if partial payments exist) -->
            ${borrow.payments && borrow.payments.length > 0 ? `
                <div class="payment-history">
                    <div class="history-toggle" onclick="togglePaymentHistory('${borrow.id}')">
                        <span><i class="fas fa-history"></i> Payment History (${borrow.payments.length})</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="history-list" id="history-${borrow.id}" style="display: none;">
                        ${borrow.payments.map(p => `
                            <div class="history-item">
                                <span class="history-date">${new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                <span class="history-amount">+ ${Utils.formatCurrency(p.amount)}</span>
                                ${p.note ? `<span class="history-note">${p.note}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Toggle payment history visibility
function togglePaymentHistory(borrowId) {
    const historyEl = document.getElementById(`history-${borrowId}`);
    if (historyEl) {
        const isHidden = historyEl.style.display === 'none';
        historyEl.style.display = isHidden ? 'block' : 'none';
    }
}

// Open partial payment modal
function openPartialPaymentModal(borrowId) {
    const modal = document.getElementById('partialPaymentModal');
    const borrowIdInput = document.getElementById('partialPaymentBorrowId');
    const amountInput = document.getElementById('partialPaymentAmount');
    const dateInput = document.getElementById('partialPaymentDate');
    
    if (borrowIdInput) borrowIdInput.value = borrowId;
    if (amountInput) amountInput.value = '';
    if (dateInput) dateInput.value = toLocalDateString(new Date());
    
    if (modal) {
        modal.classList.add('active');
    }
}

// Save partial payment
async function savePartialPayment() {
    const borrowId = document.getElementById('partialPaymentBorrowId')?.value;
    const amount = parseFloat(document.getElementById('partialPaymentAmount')?.value) || 0;
    const date = document.getElementById('partialPaymentDate')?.value;
    const note = document.getElementById('partialPaymentNote')?.value || '';
    
    if (!borrowId || amount <= 0) {
        Utils.showToast('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        // Get current borrows
        const borrows = await Storage.getBorrows() || [];
        const borrowIndex = borrows.findIndex(b => b.id === borrowId);
        
        if (borrowIndex === -1) {
            Utils.showToast('Borrow record not found', 'error');
            return;
        }
        
        const borrow = borrows[borrowIndex];
        
        // Initialize payments array if not exists
        if (!borrow.payments) {
            borrow.payments = [];
        }
        
        // Add new payment
        borrow.payments.push({
            id: Date.now().toString(),
            amount: amount,
            date: date,
            note: note
        });
        
        // Update paid amount
        borrow.paidAmount = (parseFloat(borrow.paidAmount) || 0) + amount;
        
        // Save
        borrows[borrowIndex] = borrow;
        await Storage.saveBorrows(borrows);
        
        // Close modal
        closePartialPaymentModal();
        
        // Refresh list
        if (App.loadBorrows) {
            App.loadBorrows();
        } else if (App.renderBorrowList) {
            App.renderBorrowList();
        }
        
        Utils.showToast('Payment recorded successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving partial payment:', error);
        Utils.showToast('Failed to save payment', 'error');
    }
}

// Close partial payment modal
function closePartialPaymentModal() {
    const modal = document.getElementById('partialPaymentModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions globally available
window.togglePaymentHistory = togglePaymentHistory;
window.openPartialPaymentModal = openPartialPaymentModal;
window.savePartialPayment = savePartialPayment;
window.closePartialPaymentModal = closePartialPaymentModal;

// ==================== PAYMENT FORM FIX ====================

// Add savePayment to App if not exists
if (typeof App.savePayment !== 'function') {
    App.savePayment = async function() {
        try {
            const borrowId = document.getElementById('paymentBorrowId')?.value;
            const amount = parseFloat(document.getElementById('paymentAmount')?.value) || 0;
            const date = document.getElementById('paymentDate')?.value;
            const note = document.getElementById('paymentNote')?.value || '';

            // Validation
            if (!borrowId) {
                Utils.showToast('Error: No borrow record selected', 'error');
                return;
            }

            if (amount <= 0) {
                Utils.showToast('Please enter a valid amount', 'error');
                return;
            }

            // Get borrows from storage
            const borrows = await Storage.getBorrows() || [];
            const borrowIndex = borrows.findIndex(b => b.id === borrowId);

            if (borrowIndex === -1) {
                Utils.showToast('Borrow record not found', 'error');
                return;
            }

            const borrow = borrows[borrowIndex];
            const totalAmount = parseFloat(borrow.amount) || 0;
            const currentPaid = parseFloat(borrow.paidAmount) || 0;
            const remaining = totalAmount - currentPaid;

            // Check if payment exceeds remaining
            if (amount > remaining) {
                Utils.showToast(`Payment cannot exceed ₹${remaining.toLocaleString('en-IN')}`, 'error');
                return;
            }

            // Initialize payments array if not exists
            if (!borrow.payments) {
                borrow.payments = [];
            }

            // Add payment record
            const y = new Date().getFullYear();
            const m = String(new Date().getMonth() + 1).padStart(2, '0');
            const d = String(new Date().getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            borrow.payments.push({
                id: Date.now().toString(),
                amount: amount,
                date: date || todayStr,
                note: note
            });

            // Update paid amount
            borrow.paidAmount = currentPaid + amount;

            // Update status based on payment
            const newRemaining = totalAmount - borrow.paidAmount;
            if (newRemaining <= 0) {
                borrow.status = 'completed';
            } else if (borrow.paidAmount > 0) {
                borrow.status = 'partial';
            }

            // Save back to storage
            borrows[borrowIndex] = borrow;
            await Storage.saveBorrows(borrows);

            // Close modal
            App.closePaymentModal();

            // Refresh the borrow page
            await App.loadBorrowPage();

            // Show success message
            if (newRemaining <= 0) {
                Utils.showToast(`🎉 Fully paid! Payment of ₹${amount.toLocaleString('en-IN')} recorded.`, 'success');
            } else {
                Utils.showToast(`✅ Payment recorded! Remaining: ₹${newRemaining.toLocaleString('en-IN')}`, 'success');
            }

        } catch (error) {
            console.error('Error saving payment:', error);
            Utils.showToast('Failed to save payment', 'error');
        }
    };
}

// Add closePaymentModal to App if not exists
if (typeof App.closePaymentModal !== 'function') {
    App.closePaymentModal = function() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('active');
        }
        // Clear form
        const form = document.getElementById('addPaymentForm');
        if (form) form.reset();
    };
}

// Attach form submit handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.getElementById('addPaymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Payment form submitted');
            await App.savePayment();
        });
        console.log('✅ Payment form handler attached');
    }
    
    // Close button handler
    const closePaymentBtn = document.getElementById('closePaymentModal');
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', function() {
            App.closePaymentModal();
        });
        console.log('✅ Close payment modal handler attached');
    }
});

console.log('✅ Payment form fix loaded');