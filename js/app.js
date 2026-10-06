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

        // NOTE: Storage.init() is called in app.html after Firebase auth
        // So we don't call it here anymore

        // Initialize all modules (these don't need async)
        this.initSplashScreen();
        this.initNavigation();
        this.initTheme();
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

        // Load initial page (now async - data from Firebase)
        await this.loadDashboard();
        await this.updateStats();

        // Set current date display
        this.updateCurrentDate();

        console.log("App initialized successfully!");
    },

  // ==================== SPLASH SCREEN ====================
  initSplashScreen() {
    setTimeout(() => {
      const splash = document.getElementById("splash-screen");
      const app = document.getElementById("app");

      if (splash && app) {
        splash.classList.add("fade-out");
        setTimeout(() => {
          splash.style.display = "none";
          app.classList.remove("hidden");

          // Initialize charts after app is visible
          if (typeof Charts !== "undefined") {
            Charts.init();
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
      item.addEventListener("click", () => {
        const page = item.dataset.page;
        this.navigateTo(page);

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
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        if (page) {
          this.navigateTo(page);
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
  initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const settings = Storage.getSettings();

    // Apply saved theme
    if (settings.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggle) {
        themeToggle.innerHTML =
          '<i class="fas fa-sun"></i><span>Light Mode</span>';
      }
    }

    // Theme toggle handler
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark";

        if (isDark) {
          document.documentElement.removeAttribute("data-theme");
          themeToggle.innerHTML =
            '<i class="fas fa-moon"></i><span>Dark Mode</span>';
          Storage.updateSettings({ theme: "light" });
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
          themeToggle.innerHTML =
            '<i class="fas fa-sun"></i><span>Light Mode</span>';
          Storage.updateSettings({ theme: "dark" });
        }

        // Update charts for theme change
        if (typeof Charts !== "undefined") {
          setTimeout(() => Charts.updateAll(), 100);
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
        btn.addEventListener("click", () => {
          this.openTransactionModal();
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
      addBudgetBtn.addEventListener("click", () => {
        this.openBudgetModal();
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
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveTransaction();
      });
    }
  },

  openTransactionModal(editId = null) {
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
    this.loadCategoryOptions();

    if (editId) {
      // Edit mode
      if (modalTitle) modalTitle.textContent = "Edit Transaction";

      const transactions = Storage.getTransactions();
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
            `[data-id="${transaction.category}"]`,
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

  loadCategoryOptions() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    const categories = Storage.getCategories();

    grid.innerHTML = categories
      .map(
        (cat) => `
            <div class="category-option" data-id="${cat.id}">
                <i class="fas ${cat.icon}" style="color: ${cat.color}"></i>
                <span>${cat.name}</span>
            </div>
        `,
      )
      .join("");

    // Add click handlers
    grid.querySelectorAll(".category-option").forEach((option) => {
      option.addEventListener("click", () => {
        grid
          .querySelectorAll(".category-option")
          .forEach((o) => o.classList.remove("selected"));
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

  checkBudgetAlerts(category, amount) {
    const budgets = Storage.getBudgets();
    const budget = budgets.find((b) => b.category === category);

    if (budget) {
      const transactions = Storage.getTransactions();
      const { start, end } = Utils.getDateRange("month");
      const monthTransactions = Utils.getTransactionsByDateRange(
        transactions,
        start,
        end,
      ).filter((t) => t.type === "expense" && t.category === category);

      const totalSpent = monthTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0,
      );
      const percentage = (totalSpent / budget.amount) * 100;

      if (percentage >= 100) {
        Utils.showToast(`Budget exceeded for ${category}!`, "error");
        Storage.addNotification({
          type: "budget",
          icon: "fa-exclamation-circle",
          title: "Budget Exceeded!",
          message: `You've exceeded your ${category} budget.`,
        });
      } else if (percentage >= 80) {
        Utils.showToast(
          `Warning: ${percentage.toFixed(0)}% of ${category} budget used`,
          "warning",
        );
      }
    }
  },

  editTransaction(id) {
    this.openTransactionModal(id);
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
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveBudget();
      });
    }
  },

  openBudgetModal() {
    const modal = document.getElementById("budgetModal");
    const form = document.getElementById("budgetForm");

    if (!modal || !form) return;

    form.reset();
    this.loadBudgetCategories();
    modal.classList.add("active");
  },

  loadBudgetCategories() {
    const select = document.getElementById("budgetCategory");
    if (!select) return;

    const categories = Storage.getCategories();
    const existingBudgets = Storage.getBudgets();
    const usedCategories = existingBudgets.map((b) => b.category);

    // Filter out categories that already have budgets
    const availableCategories = categories.filter(
      (c) => !usedCategories.includes(c.id),
    );

    select.innerHTML = availableCategories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");

    if (availableCategories.length === 0) {
      select.innerHTML =
        '<option value="">All categories have budgets</option>';
    }
  },

  saveBudget() {
    const category = document.getElementById("budgetCategory")?.value;
    const amount = document.getElementById("budgetAmount")?.value;
    const period = document.getElementById("budgetPeriod")?.value;

    if (!category || !amount) {
      Utils.showToast("Please fill in all fields", "error");
      return;
    }

    Storage.addBudget({
      category,
      amount: parseFloat(amount),
      period,
    });

    Utils.showToast("Budget added successfully!", "success");

    const modal = document.getElementById("budgetModal");
    if (modal) modal.classList.remove("active");

    const form = document.getElementById("budgetForm");
    if (form) form.reset();

    this.loadBudgets();
  },

  deleteBudget(id) {
    if (confirm("Are you sure you want to delete this budget?")) {
      Storage.deleteBudget(id);
      Utils.showToast("Budget deleted", "success");
      this.loadBudgets();
    }
  },

  // ==================== CATEGORY FORM ====================
  initCategoryForm() {
    const form = document.getElementById("categoryForm");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCategory();
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
      "fa-utensils",
      "fa-car",
      "fa-shopping-bag",
      "fa-file-invoice",
      "fa-gamepad",
      "fa-heartbeat",
      "fa-graduation-cap",
      "fa-plane",
      "fa-home",
      "fa-mobile-alt",
      "fa-coffee",
      "fa-dumbbell",
      "fa-book",
      "fa-music",
      "fa-film",
      "fa-paw",
      "fa-tshirt",
      "fa-gift",
      "fa-tools",
      "fa-briefcase",
      "fa-baby",
      "fa-pills",
      "fa-gas-pump",
      "fa-wifi",
    ];

    grid.innerHTML = icons
      .map(
        (icon) => `
            <div class="icon-option" data-icon="${icon}">
                <i class="fas ${icon}"></i>
            </div>
        `,
      )
      .join("");

    grid.querySelectorAll(".icon-option").forEach((option) => {
      option.addEventListener("click", () => {
        grid
          .querySelectorAll(".icon-option")
          .forEach((o) => o.classList.remove("selected"));
        option.classList.add("selected");
      });
    });
  },

  loadColorOptions() {
    const grid = document.getElementById("colorGrid");
    if (!grid) return;

    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#eab308",
      "#84cc16",
      "#22c55e",
      "#10b981",
      "#14b8a6",
      "#06b6d4",
      "#0ea5e9",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
      "#64748b",
      "#78716c",
      "#000000",
    ];

    grid.innerHTML = colors
      .map(
        (color) => `
            <div class="color-option" data-color="${color}" style="background: ${color}"></div>
        `,
      )
      .join("");

    grid.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", () => {
        grid
          .querySelectorAll(".color-option")
          .forEach((o) => o.classList.remove("selected"));
        option.classList.add("selected");
      });
    });
  },

  saveCategory() {
    const name = document.getElementById("categoryName")?.value;
    const icon = document.querySelector(".icon-option.selected")?.dataset.icon;
    const color = document.querySelector(".color-option.selected")?.dataset
      .color;

    if (!name || !icon || !color) {
      Utils.showToast("Please fill in all fields", "error");
      return;
    }

    Storage.addCategory({ name, icon, color });
    Utils.showToast("Category added successfully!", "success");

    const modal = document.getElementById("categoryModal");
    if (modal) modal.classList.remove("active");

    const form = document.getElementById("categoryForm");
    if (form) form.reset();

    this.loadSettings();
  },

  deleteCategory(id) {
    if (
      confirm(
        "Delete this category? Transactions using this category will not be deleted.",
      )
    ) {
      Storage.deleteCategory(id);
      Utils.showToast("Category deleted", "success");
      this.loadSettings();
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
        Charts.initSpendingChart();
        Charts.initCategoryChart();
        Charts.initSparklines();
    }
 },

  updateCurrentDate() {
    const dateDisplay = document.getElementById("currentDate");
    if (dateDisplay) {
      dateDisplay.textContent = Utils.formatDate(new Date(), "long");
    }
  },

    async updateStats() {
        const transactions = await Storage.getTransactions();
        const { start, end } = Utils.getDateRange('month');
        const monthTransactions = Utils.getTransactionsByDateRange(transactions, start, end);
        const totals = Utils.calculateTotals(monthTransactions);

        const settings = await Storage.getSettings();

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
    },

  async loadRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    const transactions = await Storage.getTransactions();
    const recentTransactions = transactions.slice(0, 5);
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
        const category = categories.find(c => c.id === t.category);
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
},

  async loadDashboardOverview() {
    // Borrow Overview
    const borrows = await Storage.getBorrows();
    const activeBorrows = borrows.filter(b => b.status !== 'completed');
    
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
    const activeWishlist = wishlist.filter(w => !w.purchased);
    
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
        dashNotesCount.textContent = notes.length;
    }
},
  // ==================== TRANSACTIONS PAGE ====================
  async loadTransactions(page = 1) {
    const transactions = await Storage.getTransactions();
    const categories = await Storage.getCategories();
    const perPage = 10;
    const totalPages = Math.ceil(transactions.length / perPage);
    const start = (page - 1) * perPage;
    const pageTransactions = transactions.slice(start, start + perPage);

    // Load filter categories
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory && filterCategory.options.length <= 1) {
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
        const category = categories.find(c => c.id === t.category);
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
      applyFilters.addEventListener("click", () => {
        this.applyTransactionFilters();
      });
    }

    if (clearFilters) {
      clearFilters.addEventListener("click", () => {
        this.clearTransactionFilters();
      });
    }
  },

  applyTransactionFilters() {
    const type = document.getElementById("filterType")?.value || "all";
    const category = document.getElementById("filterCategory")?.value || "all";
    const dateFrom = document.getElementById("filterDateFrom")?.value;
    const dateTo = document.getElementById("filterDateTo")?.value;

    let transactions = Storage.getTransactions();

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

    this.renderFilteredTransactions(transactions);
  },

  clearTransactionFilters() {
    const filterType = document.getElementById("filterType");
    const filterCategory = document.getElementById("filterCategory");
    const filterDateFrom = document.getElementById("filterDateFrom");
    const filterDateTo = document.getElementById("filterDateTo");

    if (filterType) filterType.value = "all";
    if (filterCategory) filterCategory.value = "all";
    if (filterDateFrom) filterDateFrom.value = "";
    if (filterDateTo) filterDateTo.value = "";

    this.loadTransactions();
  },

  renderFilteredTransactions(transactions) {
    const categories = Storage.getCategories();
    const tbody = document.getElementById("transactionsTableBody");

    if (!tbody) return;

    if (transactions.length === 0) {
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
        const category = categories.find((c) => c.id === t.category);
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
  loadAnalytics() {
    if (typeof Charts !== "undefined") {
      Charts.initTrendChart();
      Charts.initCategoryPieChart();
      Charts.initDailyPatternChart();
      Charts.initMonthlyComparisonChart();
    }

    this.loadTopCategories();
    this.loadInsights();

    // Period selector handlers
    document.querySelectorAll(".period-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".period-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (typeof Charts !== "undefined") {
          Charts.updateAll();
        }
      });
    });
  },

  loadTopCategories() {
    const container = document.getElementById("topCategories");
    if (!container) return;

    const transactions = Storage.getTransactions().filter(
      (t) => t.type === "expense",
    );
    const categories = Storage.getCategories();
    const grouped = Utils.groupByCategory(transactions);
    const totalExpense = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0,
    );

    if (totalExpense === 0) {
      container.innerHTML = '<p class="empty-message">No expense data yet</p>';
      return;
    }

    const sortedCategories = Object.entries(grouped)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    container.innerHTML = sortedCategories
      .map(([catId, info]) => {
        const category = categories.find((c) => c.id === catId);
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
  },

  loadInsights() {
    const container = document.getElementById("insightsGrid");
    if (!container) return;

    const transactions = Storage.getTransactions();
    const budgets = Storage.getBudgets();
    const insights = Utils.generateInsights(transactions, budgets);

    if (insights.length === 0) {
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
        `,
      )
      .join("");
  },

  // ==================== BUDGET PAGE ====================
  loadBudgets() {
    const budgets = Storage.getBudgets();
    const categories = Storage.getCategories();
    const transactions = Storage.getTransactions();
    const { start, end } = Utils.getDateRange("month");
    const monthTransactions = Utils.getTransactionsByDateRange(
      transactions,
      start,
      end,
    );
    const grouped = Utils.groupByCategory(
      monthTransactions.filter((t) => t.type === "expense"),
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
        const category = categories.find((c) => c.id === budget.category);
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
  },

  updateBudgetOverview(totalBudget, totalSpent) {
    const totalBudgetEl = document.getElementById("totalBudget");
    const totalSpentEl = document.getElementById("totalSpent");
    const totalRemainingEl = document.getElementById("totalRemaining");
    const overallProgress = document.getElementById("overallProgress");
    const overallPercentage = document.getElementById("overallPercentage");

    if (totalBudgetEl)
      totalBudgetEl.textContent = Utils.formatCurrency(totalBudget);
    if (totalSpentEl)
      totalSpentEl.textContent = Utils.formatCurrency(totalSpent);
    if (totalRemainingEl)
      totalRemainingEl.textContent = Utils.formatCurrency(
        Math.max(totalBudget - totalSpent, 0),
      );

    const percentage =
      totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    if (overallProgress) overallProgress.style.width = `${percentage}%`;
    if (overallPercentage)
      overallPercentage.textContent = `${percentage.toFixed(0)}%`;
  },

  // ==================== CALENDAR PAGE ====================
  initCalendar() {
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.currentCalendarMonth.setMonth(
          this.currentCalendarMonth.getMonth() - 1,
        );
        this.loadCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.currentCalendarMonth.setMonth(
          this.currentCalendarMonth.getMonth() + 1,
        );
        this.loadCalendar();
      });
    }
  },

  loadCalendar() {
    const year = this.currentCalendarMonth.getFullYear();
    const month = this.currentCalendarMonth.getMonth();
    const transactions = Storage.getTransactions();

    // Update month display
    const monthDisplay = document.getElementById("currentMonth");
    if (monthDisplay) {
      monthDisplay.textContent = new Date(year, month).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      );
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
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayTransactions = transactions.filter((t) => t.date === dateStr);
      const hasIncome = dayTransactions.some((t) => t.type === "income");
      const hasExpense = dayTransactions.some((t) => t.type === "expense");
      const isToday =
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;

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
    grid
      .querySelectorAll(".calendar-day:not(.other-month)")
      .forEach((dayEl) => {
        dayEl.addEventListener("click", () => {
          grid
            .querySelectorAll(".calendar-day")
            .forEach((d) => d.classList.remove("selected"));
          dayEl.classList.add("selected");
          this.loadDayTransactions(dayEl.dataset.date);
        });
      });

    // Load today's transactions by default
    const todayStr = today.toISOString().split("T")[0];
    this.loadDayTransactions(todayStr);
  },

  loadDayTransactions(date) {
    const container = document.getElementById("dayDetails");
    const transactionsContainer = document.getElementById("dayTransactions");

    if (!container || !transactionsContainer) return;

    const transactions = Storage.getTransactions().filter(
      (t) => t.date === date,
    );
    const categories = Storage.getCategories();

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
                const category = categories.find((c) => c.id === t.category);
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
  },

  // ==================== SETTINGS PAGE ====================
  initSettings() {
    // Save profile
    const saveProfileBtn = document.getElementById("saveProfile");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () => {
        this.saveProfile();
      });
    }

    // Currency change
    const currencySelect = document.getElementById("settingsCurrency");
    if (currencySelect) {
      currencySelect.addEventListener("change", (e) => {
        Storage.updateSettings({ currency: e.target.value });
        Utils.showToast("Currency updated!", "success");
        this.refreshCurrentPage();
      });
    }

    // Notification toggles
    ["budgetAlerts", "dailyReminders", "weeklyReports"].forEach((id) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.addEventListener("change", (e) => {
          Storage.updateSettings({ [id]: e.target.checked });
          Utils.showToast("Setting updated!", "success");
        });
      }
    });

    // Data management
    const exportBtn = document.getElementById("exportData");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const data = Storage.exportData();
        Utils.downloadFile(
          JSON.stringify(data, null, 2),
          `expenseflow_backup_${new Date().toISOString().split("T")[0]}.json`,
        );
        Utils.showToast("Data exported successfully!", "success");
      });
    }

    const importBtn = document.getElementById("importData");
    const importFile = document.getElementById("importFile");
    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => {
        importFile.click();
      });

      importFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              Storage.importData(data);
              Utils.showToast("Data imported successfully!", "success");
              this.refreshCurrentPage();
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
      clearBtn.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to clear ALL data? This cannot be undone!",
          )
        ) {
          if (
            confirm(
              "This will delete all transactions, budgets, notes, and settings. Continue?",
            )
          ) {
            Storage.clearAllData();
            Utils.showToast("All data cleared", "success");
            location.reload();
          }
        }
      });
    }
  },

  saveProfile() {
    const name = document.getElementById("settingsName")?.value;
    const email = document.getElementById("settingsEmail")?.value;

    Storage.updateSettings({ userName: name, email });
    Utils.showToast("Profile saved!", "success");
    this.updateStats();
  },

  loadSettings() {
    const settings = Storage.getSettings();
    const categories = Storage.getCategories();

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
    if (dailyReminders)
      dailyReminders.checked = settings.dailyReminders === true;
    if (weeklyReports) weeklyReports.checked = settings.weeklyReports !== false;

    // Load categories list
    const categoriesList = document.getElementById("categoriesList");
    if (categoriesList) {
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
            `,
        )
        .join("");
    }
  },

  // ==================== SEARCH ====================
  initSearch() {
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          const query = e.target.value.toLowerCase().trim();

          if (query.length < 2) return;

          const transactions = Storage.getTransactions();
          const results = transactions.filter(
            (t) =>
              t.description.toLowerCase().includes(query) ||
              t.category.toLowerCase().includes(query) ||
              (t.notes && t.notes.toLowerCase().includes(query)) ||
              (t.tags && t.tags.toLowerCase().includes(query)),
          );

          if (results.length > 0) {
            this.navigateTo("transactions");
            this.renderFilteredTransactions(results);
            Utils.showToast(`Found ${results.length} transaction(s)`, "info");
          } else {
            Utils.showToast("No transactions found", "info");
          }
        }, 500),
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
      notificationBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle("active");
        this.loadNotifications();
      });

      // Close panel when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !notificationPanel.contains(e.target) &&
          !notificationBtn.contains(e.target)
        ) {
          notificationPanel.classList.remove("active");
        }
      });
    }

    if (clearNotifications) {
      clearNotifications.addEventListener("click", () => {
        Storage.clearNotifications();
        this.loadNotifications();
        Utils.showToast("Notifications cleared", "success");
      });
    }

    // Update badge on load
    this.updateNotificationBadge();
  },

  loadNotifications() {
    const container = document.getElementById("notificationList");
    if (!container) return;

    const notifications = Storage.getNotifications();
    this.updateNotificationBadge();

    if (notifications.length === 0) {
      container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
      return;
    }

    container.innerHTML = notifications
      .map(
        (n) => `
            <div class="notification-item ${n.read ? "" : "unread"}" onclick="App.markNotificationRead('${n.id}')">
                <div class="notification-icon ${n.type}">
                    <i class="fas ${n.icon}"></i>
                </div>
                <div class="notification-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <time>${Utils.getRelativeTime(n.createdAt)}</time>
                </div>
            </div>
        `,
      )
      .join("");
  },

  markNotificationRead(id) {
    Storage.markNotificationRead(id);
    this.loadNotifications();
  },

  updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      const notifications = Storage.getNotifications();
      const unreadCount = notifications.filter((n) => !n.read).length;
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }
    },
  
  // ==================== NOTIFICATION FUNCTIONS ====================
toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const userDropdown = document.getElementById('userDropdown');
    
    // Close user dropdown if open
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }
    
    // Toggle notification dropdown
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        if (dropdown.classList.contains('show')) {
            this.loadNotifications();
        }
    }
},

async loadNotifications() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    
    if (!list) return;
    
    try {
        const notifications = await Storage.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update badge
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="App.markNotificationRead('${n.id}')">
                <div class="notification-icon ${n.type || 'info'}">
                    <i class="fas ${this.getNotificationIcon(n.type)}"></i>
                </div>
                <div class="notification-content">
                    <h5>${n.title || 'Notification'}</h5>
                    <p>${n.message || ''}</p>
                    <span class="time">${Utils.getRelativeTime(n.createdAt)}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        list.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading notifications</p>
            </div>
        `;
    }
},

getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        danger: 'fa-times-circle',
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
      exportCSV.addEventListener("click", () => {
        const transactions = Storage.getTransactions();
        Utils.exportToCSV(transactions);
        Utils.showToast("CSV exported!", "success");
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
        document
          .querySelectorAll(".borrow-tabs .tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));
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
        document
          .querySelectorAll(".status-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const partialSection = document.querySelector(
          ".partial-payment-section",
        );
        if (partialSection) {
          partialSection.style.display =
            btn.dataset.status === "partial" ||
            btn.dataset.status === "completed"
              ? "block"
              : "none";
        }
      });
    });

    // Form submission
    const borrowForm = document.getElementById("borrowForm");
    if (borrowForm) {
      borrowForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveBorrowRecord();
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
      addPaymentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addPaymentRecord();
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

  openBorrowModal(type, editId = null) {
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
    document
      .querySelectorAll(".status-btn")
      .forEach((b) => b.classList.remove("active"));
    const pendingBtn = document.querySelector(
      '.status-btn[data-status="pending"]',
    );
    if (pendingBtn) pendingBtn.classList.add("active");

    const partialSection = document.querySelector(".partial-payment-section");
    if (partialSection) partialSection.style.display = "none";

    // Set title
    if (modalTitle) {
      if (type === "given") {
        modalTitle.textContent = editId
          ? "Edit - Money Given"
          : "Money Given (Lent to Someone)";
      } else {
        modalTitle.textContent = editId
          ? "Edit - Money Taken"
          : "Money Taken (Borrowed from Someone)";
      }
    }

    // If editing, populate form
    if (editId) {
      const borrows = Storage.getBorrows();
      const borrow = borrows.find((b) => b.id === editId);

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
        document
          .querySelectorAll(".status-btn")
          .forEach((b) => b.classList.remove("active"));
        const statusBtn = document.querySelector(
          `.status-btn[data-status="${borrow.status}"]`,
        );
        if (statusBtn) statusBtn.classList.add("active");

        if (borrow.status === "partial" || borrow.status === "completed") {
          if (partialSection) partialSection.style.display = "block";
        }
      }
    }

    modal.classList.add("active");
  },

  saveBorrowRecord() {
    const type = document.getElementById("borrowType")?.value;
    const editId = document.getElementById("borrowId")?.value;

    const record = {
      type,
      person: document.getElementById("borrowPerson")?.value,
      amount: parseFloat(document.getElementById("borrowAmount")?.value),
      date: document.getElementById("borrowDate")?.value,
      dueDate: document.getElementById("borrowDueDate")?.value || null,
      interest:
        parseFloat(document.getElementById("borrowInterest")?.value) || 0,
      reason: document.getElementById("borrowReason")?.value || "",
      contact: document.getElementById("borrowContact")?.value || "",
      notes: document.getElementById("borrowNotes")?.value || "",
      status:
        document.querySelector(".status-btn.active")?.dataset.status ||
        "pending",
      paidAmount:
        parseFloat(document.getElementById("borrowPaidAmount")?.value) || 0,
    };

    // Validation
    if (!record.person || !record.amount || !record.date) {
      Utils.showToast("Please fill in required fields", "error");
      return;
    }

    if (editId) {
      Storage.updateBorrow(editId, record);
      Utils.showToast("Record updated successfully!", "success");
    } else {
      Storage.addBorrow(record);
      Utils.showToast("Record added successfully!", "success");
    }

    const modal = document.getElementById("borrowModal");
    if (modal) modal.classList.remove("active");

    this.loadBorrowPage();
  },

  loadBorrowPage() {
    const borrows = Storage.getBorrows();
    const given = borrows.filter(
      (b) => b.type === "given" && b.status !== "completed",
    );
    const taken = borrows.filter(
      (b) => b.type === "taken" && b.status !== "completed",
    );
    const completed = borrows.filter((b) => b.status === "completed");

    // Calculate totals
    const totalGiven = given.reduce(
      (sum, b) =>
        sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
      0,
    );
    const totalTaken = taken.reduce(
      (sum, b) =>
        sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
      0,
    );
    const netBalance = totalGiven - totalTaken;

    // Calculate overdue
    const today = new Date().toISOString().split("T")[0];
    const overdueBorrows = borrows.filter(
      (b) => b.dueDate && b.dueDate < today && b.status !== "completed",
    );
    const overdueAmount = overdueBorrows.reduce(
      (sum, b) =>
        sum + (parseFloat(b.amount) - (parseFloat(b.paidAmount) || 0)),
      0,
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
    const netCard = document
      .querySelector("#netBorrow")
      ?.closest(".summary-info");
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
  },

  renderBorrowList(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const today = new Date().toISOString().split("T")[0];

    if (items.length === 0) {
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
        const isOverdue =
          item.dueDate && item.dueDate < today && item.status !== "completed";
        const remaining =
          parseFloat(item.amount) - (parseFloat(item.paidAmount) || 0);
        const progress =
          ((parseFloat(item.paidAmount) || 0) / parseFloat(item.amount)) * 100;
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
                        ${
                          item.status === "partial"
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

    if (items.length === 0) {
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

  openPaymentModal(borrowId) {
    const borrows = Storage.getBorrows();
    const borrow = borrows.find((b) => b.id === borrowId);

    if (!borrow) return;

    const remaining =
      parseFloat(borrow.amount) - (parseFloat(borrow.paidAmount) || 0);
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
                `,
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
  },

  addPaymentRecord() {
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

    Storage.addPayment(borrowId, { amount, date, note });
    Utils.showToast("Payment recorded successfully!", "success");

    const modal = document.getElementById("paymentModal");
    if (modal) modal.classList.remove("active");

    this.loadBorrowPage();
    this.loadDashboardOverview();
  },

  deleteBorrowRecord(id) {
    if (confirm("Are you sure you want to delete this record?")) {
      Storage.deleteBorrow(id);
      Utils.showToast("Record deleted", "success");
      this.loadBorrowPage();
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
      wishlistForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveWishlistItem();
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
    const filterElements = [
      "wishlistPriorityFilter",
      "wishlistCategoryFilter",
      "wishlistSort",
    ];
    filterElements.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", () => this.filterWishlist());
      }
    });

    // View toggle
    document.querySelectorAll("#wishlist .view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("#wishlist .view-btn")
          .forEach((b) => b.classList.remove("active"));
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

  openWishlistModal(editId = null) {
    const modal = document.getElementById("wishlistModal");
    const form = document.getElementById("wishlistForm");
    const modalTitle = document.getElementById("wishlistModalTitle");

    if (!modal || !form) return;

    form.reset();
    this.editingWishlist = editId;

    const wishlistItemId = document.getElementById("wishlistItemId");
    const wishlistImagePreview = document.getElementById(
      "wishlistImagePreview",
    );

    if (wishlistItemId) wishlistItemId.value = editId || "";
    if (wishlistImagePreview) wishlistImagePreview.innerHTML = "";

    if (editId) {
      if (modalTitle) modalTitle.textContent = "Edit Future Purchase";

      const wishlist = Storage.getWishlist();
      const item = wishlist.find((w) => w.id === editId);

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
    } else {
      if (modalTitle) modalTitle.textContent = "Add Future Purchase";
    }

    modal.classList.add("active");
  },

  saveWishlistItem() {
    const editId = document.getElementById("wishlistItemId")?.value;

    const item = {
      name: document.getElementById("wishlistName")?.value,
      price: parseFloat(document.getElementById("wishlistPrice")?.value),
      savedAmount:
        parseFloat(document.getElementById("wishlistSavedAmount")?.value) || 0,
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

    if (editId) {
      Storage.updateWishlistItem(editId, item);
      Utils.showToast("Item updated!", "success");
    } else {
      Storage.addWishlistItem(item);
      Utils.showToast("Item added to wishlist!", "success");
    }

    const modal = document.getElementById("wishlistModal");
    if (modal) modal.classList.remove("active");

    this.loadWishlistPage();
  },

  loadWishlistPage() {
    const wishlist = Storage.getWishlist().filter((w) => !w.purchased);

    // Calculate summaries
    const totalCost = wishlist.reduce((sum, w) => sum + parseFloat(w.price), 0);
    const totalSaved = wishlist.reduce(
      (sum, w) => sum + (parseFloat(w.savedAmount) || 0),
      0,
    );
    const highPriority = wishlist.filter((w) => w.priority === "high").length;

    // Update summary cards
    const summaryElements = {
      wishlistCount: wishlist.length,
      wishlistTotal: Utils.formatCurrency(totalCost),
      wishlistSaved: Utils.formatCurrency(totalSaved),
      highPriorityCount: highPriority,
    };

    Object.entries(summaryElements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    this.renderWishlist(wishlist);
  },

  filterWishlist() {
    let wishlist = Storage.getWishlist().filter((w) => !w.purchased);

    const priority =
      document.getElementById("wishlistPriorityFilter")?.value || "all";
    const category =
      document.getElementById("wishlistCategoryFilter")?.value || "all";
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
        wishlist.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
        );
        break;
      case "price-high":
        wishlist.sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        wishlist.sort((a, b) => a.price - b.price);
        break;
      case "date":
        wishlist.sort(
          (a, b) =>
            new Date(a.targetDate || "9999") - new Date(b.targetDate || "9999"),
        );
        break;
      case "progress":
        wishlist.sort(
          (a, b) =>
            (b.savedAmount || 0) / b.price - (a.savedAmount || 0) / a.price,
        );
        break;
    }

    this.renderWishlist(wishlist);
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

    if (items.length === 0) {
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
        const progress =
          item.price > 0 ? ((item.savedAmount || 0) / item.price) * 100 : 0;
        const icon = categoryIcons[item.category] || "📦";

        return `
                <div class="wishlist-item animate-card" style="animation-delay: ${index * 0.1}s">
                    <div class="wishlist-image">
                        ${
                          item.image
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
                        
                        ${
                          item.targetDate
                            ? `
                            <div class="wishlist-target-date">
                                <i class="fas fa-calendar-alt"></i>
                                Target: ${Utils.formatDate(item.targetDate)}
                            </div>
                        `
                            : ""
                        }
                        
                        ${
                          item.description
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
                            ${
                              item.link
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

  addSavingsToWishlist(id) {
    const wishlist = Storage.getWishlist();
    const item = wishlist.find((w) => w.id === id);

    if (!item) return;

    const remaining = item.price - (item.savedAmount || 0);
    const amount = prompt(
      `Add savings for "${item.name}"\n\nRemaining: ${Utils.formatCurrency(remaining)}\n\nEnter amount:`,
    );

    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      const newSaved = (parseFloat(item.savedAmount) || 0) + parseFloat(amount);
      Storage.updateWishlistItem(id, { savedAmount: newSaved });

      const progress = (newSaved / item.price) * 100;
      if (progress >= 100) {
        Utils.showToast(`🎉 Goal reached for "${item.name}"!`, "success");
      } else {
        Utils.showToast(
          `Added ${Utils.formatCurrency(parseFloat(amount))} to savings!`,
          "success",
        );
      }

      this.loadWishlistPage();
    }
  },

  markWishlistPurchased(id) {
    const wishlist = Storage.getWishlist();
    const item = wishlist.find((w) => w.id === id);

    if (!item) return;

    if (confirm(`Mark "${item.name}" as purchased?`)) {
      Storage.markAsPurchased(id);
      Utils.showToast("Item marked as purchased! 🎉", "success");
      this.loadWishlistPage();
    }
  },

  deleteWishlistItem(id) {
    if (confirm("Delete this item from wishlist?")) {
      Storage.deleteWishlistItem(id);
      Utils.showToast("Item deleted", "success");
      this.loadWishlistPage();
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
        document
          .querySelectorAll(".note-color")
          .forEach((c) => c.classList.remove("active"));
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
      noteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveNote();
      });
    }

    // Search
    const notesSearch = document.getElementById("notesSearch");
    if (notesSearch) {
      notesSearch.addEventListener(
        "input",
        Utils.debounce(() => {
          this.filterNotes();
        }, 300),
      );
    }

    // Filter chips
    document.querySelectorAll("#notes .filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document
          .querySelectorAll("#notes .filter-chip")
          .forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.filterNotes();
      });
    });

    // View toggle
    document.querySelectorAll("#notes .view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("#notes .view-btn")
          .forEach((b) => b.classList.remove("active"));
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
      pinNoteBtn.addEventListener("click", () => {
        const modal = document.getElementById("viewNoteModal");
        const noteId = modal?.dataset.noteId;
        if (noteId) {
          Storage.toggleNotePin(noteId);
          Utils.showToast("Note pin toggled!", "success");
          modal.classList.remove("active");
          this.loadNotesPage();
        }
      });
    }

    const deleteNoteBtn = document.getElementById("deleteNoteBtn");
    if (deleteNoteBtn) {
      deleteNoteBtn.addEventListener("click", () => {
        const modal = document.getElementById("viewNoteModal");
        const noteId = modal?.dataset.noteId;
        if (noteId && confirm("Delete this note?")) {
          Storage.deleteNote(noteId);
          Utils.showToast("Note deleted", "success");
          modal.classList.remove("active");
          this.loadNotesPage();
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

  openNoteModal(editId = null) {
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
    document
      .querySelectorAll(".note-color")
      .forEach((c) => c.classList.remove("active"));
    const defaultColor = document.querySelector(
      '.note-color[data-color="#fff9c4"]',
    );
    if (defaultColor) defaultColor.classList.add("active");

    if (editId) {
      if (modalTitle) modalTitle.textContent = "Edit Note";

      const notes = Storage.getNotes();
      const note = notes.find((n) => n.id === editId);

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
        document
          .querySelectorAll(".note-color")
          .forEach((c) => c.classList.remove("active"));
        const colorBtn = document.querySelector(
          `.note-color[data-color="${note.color}"]`,
        );
        if (colorBtn) colorBtn.classList.add("active");
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

  saveNote() {
    const editId = document.getElementById("noteId")?.value;
    const noteContent = document.getElementById("noteContent");

    const note = {
      title: document.getElementById("noteTitle")?.value,
      category: document.getElementById("noteCategory")?.value || "personal",
      content: noteContent?.innerHTML || "",
      color:
        document.querySelector(".note-color.active")?.dataset.color ||
        "#fff9c4",
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

    if (editId) {
      Storage.updateNote(editId, note);
      Utils.showToast("Note updated!", "success");
    } else {
      Storage.addNote(note);
      Utils.showToast("Note created!", "success");
    }

    const modal = document.getElementById("noteModal");
    if (modal) modal.classList.remove("active");

    this.loadNotesPage();
  },

  loadNotesPage() {
    const notes = Storage.getNotes();
    const pinned = notes.filter((n) => n.pinned);
    const unpinned = notes.filter((n) => !n.pinned);

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
  },

  filterNotes() {
    const search =
      document.getElementById("notesSearch")?.value.toLowerCase() || "";
    const filter =
      document.querySelector("#notes .filter-chip.active")?.dataset.filter ||
      "all";

    let notes = Storage.getNotes();

    // Apply search
    if (search) {
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search) ||
          (n.tags && n.tags.toLowerCase().includes(search)),
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

    if (notes.length === 0) {
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
                    ${
                      note.tags
                        ? `
                        <div class="note-tags">
                            ${note.tags
                              .split(",")
                              .slice(0, 3)
                              .map(
                                (tag) =>
                                  `<span class="note-tag">${tag.trim()}</span>`,
                              )
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

  viewNote(id) {
    const notes = Storage.getNotes();
    const note = notes.find((n) => n.id === id);

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
  },

  toggleNotePin(id) {
    Storage.toggleNotePin(id);
    Utils.showToast("Note pin toggled!", "success");
    this.loadNotesPage();
  },

  deleteNote(id) {
    if (confirm("Delete this note?")) {
      Storage.deleteNote(id);
      Utils.showToast("Note deleted", "success");
      this.loadNotesPage();
    }
  },

  // ==================== UTILITY METHODS ====================
  async refreshCurrentPage() {
    await this.navigateTo(this.currentPage);
    await this.updateStats();

    if (typeof Charts !== "undefined") {
      Charts.updateAll();
    }
  },
};

// ==================== INITIALIZE APP ====================
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

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

// Check if authenticated
if (sessionStorage.getItem("ef_access_granted") !== "true") {
  window.location.href = "index.html";
}

// Logout handler
document.getElementById("logoutBtn")?.addEventListener("click", function () {
  if (confirm("Are you sure you want to logout?")) {
    sessionStorage.removeItem("ef_access_granted");
    window.location.href = "index.html";
  }
});
