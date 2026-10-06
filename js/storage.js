// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  STORAGE.JS - Firebase Cloud Storage                                      ║
// ║  All data syncs across devices in real-time!                              ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const Storage = {
    db: null,
    userId: null,
    userRef: null,
    listeners: [],
    isInitialized: false,

    // ==================== INITIALIZATION ====================
    async init(userId) {
        if (this.isInitialized && this.userId === userId) {
            console.log('Storage already initialized');
            return;
        }

        this.userId = userId;
        this.db = firebase.firestore();
        this.userRef = this.db.collection('users').doc(userId);
        this.isInitialized = true;
        
        console.log('Storage initialized for user:', userId);

        // Ensure user document exists
        try {
            const userDoc = await this.userRef.get();
            if (!userDoc.exists) {
                await this.userRef.set({
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    settings: this.getDefaultSettings()
                });
            }
        } catch (error) {
            console.error('Error initializing user document:', error);
        }
    },

    // Get user collection reference
    getUserCollection(collectionName) {
        if (!this.userRef) {
            console.error('Storage not initialized!');
            return null;
        }
        return this.userRef.collection(collectionName);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // ==================== TRANSACTIONS ====================
    async getTransactions() {
        try {
            const snapshot = await this.getUserCollection('transactions')
                .orderBy('date', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },

    async addTransaction(transaction) {
        try {
            transaction.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await this.getUserCollection('transactions').add(transaction);
            console.log('Transaction added:', docRef.id);
            return { id: docRef.id, ...transaction };
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    },

    async updateTransaction(id, updates) {
        try {
            updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await this.getUserCollection('transactions').doc(id).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    },

    async deleteTransaction(id) {
        try {
            await this.getUserCollection('transactions').doc(id).delete();
            console.log('Transaction deleted:', id);
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    },

    onTransactionsChange(callback) {
        const unsubscribe = this.getUserCollection('transactions')
            .orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(transactions);
            }, error => {
                console.error('Transactions listener error:', error);
            });
        this.listeners.push(unsubscribe);
        return unsubscribe;
    },

    // ==================== BUDGETS ====================
    async getBudgets() {
        try {
            const snapshot = await this.getUserCollection('budgets').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting budgets:', error);
            return [];
        }
    },

    async addBudget(budget) {
        try {
            budget.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await this.getUserCollection('budgets').add(budget);
            return { id: docRef.id, ...budget };
        } catch (error) {
            console.error('Error adding budget:', error);
            throw error;
        }
    },

    async updateBudget(id, updates) {
        try {
            await this.getUserCollection('budgets').doc(id).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    },

    async deleteBudget(id) {
        try {
            await this.getUserCollection('budgets').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting budget:', error);
            throw error;
        }
    },

    // ==================== CATEGORIES ====================
    DEFAULT_CATEGORIES: [
        { id: 'food', name: 'Food & Dining', icon: 'fa-utensils', color: '#ef4444' },
        { id: 'transport', name: 'Transportation', icon: 'fa-car', color: '#f59e0b' },
        { id: 'shopping', name: 'Shopping', icon: 'fa-shopping-bag', color: '#8b5cf6' },
        { id: 'bills', name: 'Bills & Utilities', icon: 'fa-file-invoice', color: '#3b82f6' },
        { id: 'entertainment', name: 'Entertainment', icon: 'fa-gamepad', color: '#ec4899' },
        { id: 'health', name: 'Healthcare', icon: 'fa-heartbeat', color: '#10b981' },
        { id: 'education', name: 'Education', icon: 'fa-graduation-cap', color: '#6366f1' },
        { id: 'travel', name: 'Travel', icon: 'fa-plane', color: '#14b8a6' },
        { id: 'groceries', name: 'Groceries', icon: 'fa-shopping-cart', color: '#84cc16' },
        { id: 'salary', name: 'Salary', icon: 'fa-briefcase', color: '#22c55e' },
        { id: 'freelance', name: 'Freelance', icon: 'fa-laptop', color: '#06b6d4' },
        { id: 'investment', name: 'Investment', icon: 'fa-chart-line', color: '#eab308' },
        { id: 'gift', name: 'Gifts', icon: 'fa-gift', color: '#f43f5e' },
        { id: 'other', name: 'Other', icon: 'fa-ellipsis-h', color: '#64748b' }
    ],

    async getCategories() {
        try {
            const snapshot = await this.getUserCollection('categories').get();
            if (snapshot.empty) {
                await this.initializeDefaultCategories();
                return this.DEFAULT_CATEGORIES;
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting categories:', error);
            return this.DEFAULT_CATEGORIES;
        }
    },

    async initializeDefaultCategories() {
        try {
            const batch = this.db.batch();
            for (const cat of this.DEFAULT_CATEGORIES) {
                const ref = this.getUserCollection('categories').doc(cat.id);
                batch.set(ref, cat);
            }
            await batch.commit();
            console.log('Default categories initialized');
        } catch (error) {
            console.error('Error initializing categories:', error);
        }
    },

    async addCategory(category) {
        try {
            category.id = category.id || this.generateId();
            await this.getUserCollection('categories').doc(category.id).set(category);
            return category;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            await this.getUserCollection('categories').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    // ==================== SETTINGS ====================
    getDefaultSettings() {
        return {
            currency: 'INR',
            currencySymbol: '₹',
            userName: 'User',
            email: '',
            theme: 'light',
            budgetAlerts: true,
            dailyReminders: false,
            weeklyReports: true
        };
    },

    async getSettings() {
        try {
            const doc = await this.userRef.get();
            if (doc.exists && doc.data().settings) {
                return { ...this.getDefaultSettings(), ...doc.data().settings };
            }
            return this.getDefaultSettings();
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.getDefaultSettings();
        }
    },

    async updateSettings(updates) {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = { ...currentSettings, ...updates };
            await this.userRef.update({ settings: newSettings });
            return newSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // ==================== BORROWS ====================
    async getBorrows() {
        try {
            const snapshot = await this.getUserCollection('borrows')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting borrows:', error);
            return [];
        }
    },

    async addBorrow(borrow) {
        try {
            borrow.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            borrow.payments = [];
            borrow.paidAmount = 0;
            borrow.status = 'pending';
            const docRef = await this.getUserCollection('borrows').add(borrow);
            return { id: docRef.id, ...borrow };
        } catch (error) {
            console.error('Error adding borrow:', error);
            throw error;
        }
    },

    async updateBorrow(id, updates) {
        try {
            await this.getUserCollection('borrows').doc(id).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Error updating borrow:', error);
            throw error;
        }
    },

    async deleteBorrow(id) {
        try {
            await this.getUserCollection('borrows').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting borrow:', error);
            throw error;
        }
    },

    async addPayment(borrowId, payment) {
        try {
            const borrowRef = this.getUserCollection('borrows').doc(borrowId);
            const doc = await borrowRef.get();
            
            if (!doc.exists) return null;

            const borrow = doc.data();
            const payments = borrow.payments || [];
            
            payment.id = this.generateId();
            payment.createdAt = new Date().toISOString();
            payments.push(payment);
            
            const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            let status = 'pending';
            
            if (totalPaid >= parseFloat(borrow.amount)) {
                status = 'completed';
            } else if (totalPaid > 0) {
                status = 'partial';
            }

            await borrowRef.update({
                payments: payments,
                paidAmount: totalPaid,
                status: status
            });

            return { id: borrowId, payments, paidAmount: totalPaid, status };
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    },

    // ==================== WISHLIST ====================
    async getWishlist() {
        try {
            const snapshot = await this.getUserCollection('wishlist')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting wishlist:', error);
            return [];
        }
    },

    async addWishlistItem(item) {
        try {
            item.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            item.purchased = false;
            const docRef = await this.getUserCollection('wishlist').add(item);
            return { id: docRef.id, ...item };
        } catch (error) {
            console.error('Error adding wishlist item:', error);
            throw error;
        }
    },

    async updateWishlistItem(id, updates) {
        try {
            await this.getUserCollection('wishlist').doc(id).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Error updating wishlist item:', error);
            throw error;
        }
    },

    async deleteWishlistItem(id) {
        try {
            await this.getUserCollection('wishlist').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting wishlist item:', error);
            throw error;
        }
    },

    async markAsPurchased(id) {
        return this.updateWishlistItem(id, {
            purchased: true,
            purchasedAt: new Date().toISOString()
        });
    },

    // ==================== NOTES ====================
    async getNotes() {
        try {
            const snapshot = await this.getUserCollection('notes')
                .orderBy('updatedAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting notes:', error);
            return [];
        }
    },

    async addNote(note) {
        try {
            const now = new Date().toISOString();
            note.createdAt = now;
            note.updatedAt = now;
            note.pinned = note.pinned || false;
            const docRef = await this.getUserCollection('notes').add(note);
            return { id: docRef.id, ...note };
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    },

    async updateNote(id, updates) {
        try {
            updates.updatedAt = new Date().toISOString();
            await this.getUserCollection('notes').doc(id).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    },

    async deleteNote(id) {
        try {
            await this.getUserCollection('notes').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    },

    async toggleNotePin(id) {
        try {
            const doc = await this.getUserCollection('notes').doc(id).get();
            if (doc.exists) {
                const currentPinned = doc.data().pinned || false;
                await this.getUserCollection('notes').doc(id).update({
                    pinned: !currentPinned,
                    updatedAt: new Date().toISOString()
                });
                return { id, pinned: !currentPinned };
            }
            return null;
        } catch (error) {
            console.error('Error toggling pin:', error);
            throw error;
        }
    },

    // ==================== NOTIFICATIONS ====================
    async getNotifications() {
        try {
            const snapshot = await this.getUserCollection('notifications')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    },

    async addNotification(notification) {
        try {
            notification.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            notification.read = false;
            const docRef = await this.getUserCollection('notifications').add(notification);
            return { id: docRef.id, ...notification };
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    async markNotificationRead(id) {
        try {
            await this.getUserCollection('notifications').doc(id).update({ read: true });
            return true;
        } catch (error) {
            console.error('Error marking notification read:', error);
            throw error;
        }
    },

    async clearNotifications() {
        try {
            const snapshot = await this.getUserCollection('notifications').get();
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error clearing notifications:', error);
            throw error;
        }
    },

    // ==================== EXPORT/IMPORT ====================
    async exportData() {
        try {
            const [transactions, budgets, categories, borrows, wishlist, notes, settings] = 
                await Promise.all([
                    this.getTransactions(),
                    this.getBudgets(),
                    this.getCategories(),
                    this.getBorrows(),
                    this.getWishlist(),
                    this.getNotes(),
                    this.getSettings()
                ]);

            return {
                transactions,
                budgets,
                categories,
                borrows,
                wishlist,
                notes,
                settings,
                exportedAt: new Date().toISOString(),
                userId: this.userId
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    },

    async importData(data) {
        try {
            const batch = this.db.batch();

            // Import transactions
            if (data.transactions && data.transactions.length) {
                for (const t of data.transactions) {
                    const { id, ...tData } = t;
                    const ref = this.getUserCollection('transactions').doc();
                    batch.set(ref, tData);
                }
            }

            // Import budgets
            if (data.budgets && data.budgets.length) {
                for (const b of data.budgets) {
                    const { id, ...bData } = b;
                    const ref = this.getUserCollection('budgets').doc();
                    batch.set(ref, bData);
                }
            }

            // Import borrows
            if (data.borrows && data.borrows.length) {
                for (const b of data.borrows) {
                    const { id, ...bData } = b;
                    const ref = this.getUserCollection('borrows').doc();
                    batch.set(ref, bData);
                }
            }

            // Import wishlist
            if (data.wishlist && data.wishlist.length) {
                for (const w of data.wishlist) {
                    const { id, ...wData } = w;
                    const ref = this.getUserCollection('wishlist').doc();
                    batch.set(ref, wData);
                }
            }

            // Import notes
            if (data.notes && data.notes.length) {
                for (const n of data.notes) {
                    const { id, ...nData } = n;
                    const ref = this.getUserCollection('notes').doc();
                    batch.set(ref, nData);
                }
            }

            await batch.commit();

            // Import settings
            if (data.settings) {
                await this.updateSettings(data.settings);
            }

            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    },

    async clearAllData() {
        try {
            const collections = ['transactions', 'budgets', 'borrows', 'wishlist', 'notes', 'notifications'];
            
            for (const collectionName of collections) {
                const snapshot = await this.getUserCollection(collectionName).get();
                const batch = this.db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }

            // Reset settings
            await this.userRef.update({
                settings: this.getDefaultSettings()
            });

            // Reinitialize categories
            await this.initializeDefaultCategories();

            console.log('All data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    },

    // ==================== CLEANUP ====================
    cleanup() {
        this.listeners.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (e) {
                console.error('Error unsubscribing:', e);
            }
        });
        this.listeners = [];
        this.isInitialized = false;
        console.log('Storage cleanup complete');
    }
};