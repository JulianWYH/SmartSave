// SmartSave - Student Budgeting App
// Main JavaScript Application Logic

class SmartSaveApp {
    constructor() {
        this.data = {
            budget: 0,
            expenses: [],
            savingsGoals: [],
            categories: {
                food: { name: 'Food', icon: '🍔', budget: 0, spent: 0 },
                transport: { name: 'Transport', icon: '🚌', budget: 0, spent: 0 },
                entertainment: { name: 'Entertainment', icon: '🎮', budget: 0, spent: 0 },
                shopping: { name: 'Shopping', icon: '🛍️', budget: 0, spent: 0 },
                'personal-care': { name: 'Personal Care', icon: '💄', budget: 0, spent: 0 },
                subscription: { name: 'Subscriptions', icon: '📱', budget: 0, spent: 0 },
                other: { name: 'Other', icon: '📝', budget: 0, spent: 0 }
            }
        };
        
        this.chart = null;
        this.isDarkMode = false;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.initializeChart();
        this.checkTheme();
        
        // Show welcome message for new users
        if (this.isFirstTime()) {
            this.showWelcomeMessage();
        }
    }
    
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleMobileMenu());
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Budget modal
        document.getElementById('setBudgetBtn').addEventListener('click', () => this.showBudgetModal());
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.hideBudgetModal());
        document.getElementById('cancelBudgetBtn').addEventListener('click', () => this.hideBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.saveBudget(e));
        
        // Expense tracking
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.toggleExpenseForm());
        document.getElementById('cancelExpenseBtn').addEventListener('click', () => this.hideExpenseForm());
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.addExpense(e));
        
        // Savings goals
        document.getElementById('addGoalBtn').addEventListener('click', () => this.addSavingsGoal());
        
        // Modal overlay click to close
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideBudgetModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Auto-save on data changes
        window.addEventListener('beforeunload', () => this.saveData());
    }
    
    // Data Management
    loadData() {
        try {
            const savedData = localStorage.getItem('smartsave-data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                this.data = { ...this.data, ...parsed };
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error loading saved data', 'error');
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('smartsave-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showToast('Error saving data', 'error');
        }
    }
    
    isFirstTime() {
        return !localStorage.getItem('smartsave-data');
    }
    
    // Theme Management
    checkTheme() {
        const savedTheme = localStorage.getItem('smartsave-theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.enableDarkMode();
        }
    }
    
    toggleTheme() {
        if (this.isDarkMode) {
            this.enableLightMode();
        } else {
            this.enableDarkMode();
        }
    }
    
    enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('smartsave-theme', 'dark');
        this.isDarkMode = true;
    }
    
    enableLightMode() {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('smartsave-theme', 'light');
        this.isDarkMode = false;
    }
    
    // Navigation
    toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.toggle('active');
    }
    
    handleNavigation(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        
        // Update active nav item
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
        
        // Smooth scroll to section
        if (targetId && targetId.startsWith('#')) {
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                this.toggleMobileMenu(); // Close mobile menu
            }
        }
    }
    
    // Budget Management
    showBudgetModal() {
        document.getElementById('monthlyBudget').value = this.data.budget || '';
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('monthlyBudget').focus();
    }
    
    hideBudgetModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    }
    
    saveBudget(e) {
        e.preventDefault();
        const budgetValue = parseFloat(document.getElementById('monthlyBudget').value);
        
        if (budgetValue > 0) {
            this.data.budget = budgetValue;
            this.distributeBudgetToCategories();
            this.saveData();
            this.updateUI();
            this.hideBudgetModal();
            this.showToast('Budget saved successfully!', 'success');
        } else {
            this.showToast('Please enter a valid budget amount', 'error');
        }
    }
    
    distributeBudgetToCategories() {
        // Smart budget distribution based on student spending patterns
        const distributions = {
            food: 0.35,          // 35% - Food is typically the largest expense
            transport: 0.15,     // 15% - Transport costs
            entertainment: 0.20, // 20% - Entertainment and social activities
            shopping: 0.15,      // 15% - Clothes, books, supplies
            'personal-care': 0.05, // 5% - Personal care items
            subscription: 0.05,  // 5% - Phone, streaming services
            other: 0.05         // 5% - Miscellaneous
        };
        
        Object.keys(this.data.categories).forEach(category => {
            this.data.categories[category].budget = this.data.budget * distributions[category];
        });
    }
    
    // Expense Management
    toggleExpenseForm() {
        const container = document.getElementById('expenseFormContainer');
        const isVisible = container.style.display !== 'none';
        
        if (isVisible) {
            this.hideExpenseForm();
        } else {
            this.showExpenseForm();
        }
    }
    
    showExpenseForm() {
        document.getElementById('expenseFormContainer').style.display = 'block';
        document.getElementById('expenseAmount').focus();
        document.getElementById('addExpenseBtn').innerHTML = '<i class="fas fa-minus"></i> Cancel';
    }
    
    hideExpenseForm() {
        document.getElementById('expenseFormContainer').style.display = 'none';
        document.getElementById('expenseForm').reset();
        document.getElementById('addExpenseBtn').innerHTML = '<i class="fas fa-plus"></i> Add Expense';
    }
    
    addExpense(e) {
        e.preventDefault();
        const form = e.target;
        const amount = parseFloat(form.expenseAmount.value);
        const category = form.expenseCategory.value;
        const description = form.expenseDescription.value || 'No description';
        
        if (amount > 0 && category) {
            const expense = {
                id: Date.now(),
                amount: amount,
                category: category,
                description: description,
                date: new Date().toISOString(),
                timestamp: Date.now()
            };
            
            this.data.expenses.unshift(expense);
            this.data.categories[category].spent += amount;
            
            this.saveData();
            this.updateUI();
            this.hideExpenseForm();
            this.showToast(`Added $${amount.toFixed(2)} expense`, 'success');
            
            // Check for budget alerts
            this.checkBudgetAlerts(category);
        } else {
            this.showToast('Please fill in all required fields', 'error');
        }
    }
    
    deleteExpense(expenseId) {
        const expense = this.data.expenses.find(exp => exp.id === expenseId);
        if (expense) {
            this.data.expenses = this.data.expenses.filter(exp => exp.id !== expenseId);
            this.data.categories[expense.category].spent -= expense.amount;
            
            this.saveData();
            this.updateUI();
            this.showToast('Expense deleted', 'success');
        }
    }
    
    checkBudgetAlerts(category) {
        const categoryData = this.data.categories[category];
        const spentPercentage = (categoryData.spent / categoryData.budget) * 100;
        
        if (spentPercentage >= 90) {
            this.showToast(`Warning: You've spent ${spentPercentage.toFixed(0)}% of your ${categoryData.name} budget!`, 'warning');
        } else if (spentPercentage >= 75) {
            this.showToast(`You're approaching your ${categoryData.name} budget limit (${spentPercentage.toFixed(0)}%)`, 'warning');
        }
    }
    
    // Savings Goals
    addSavingsGoal() {
        const goalName = prompt('What are you saving for?');
        const goalAmount = parseFloat(prompt('How much do you want to save?'));
        
        if (goalName && goalAmount > 0) {
            const goal = {
                id: Date.now(),
                name: goalName,
                target: goalAmount,
                current: 0,
                created: new Date().toISOString()
            };
            
            this.data.savingsGoals.push(goal);
            this.saveData();
            this.updateUI();
            this.showToast(`Savings goal "${goalName}" created!`, 'success');
        }
    }
    
    updateSavingsGoal(goalId, amount) {
        const goal = this.data.savingsGoals.find(g => g.id === goalId);
        if (goal) {
            goal.current = Math.min(goal.current + amount, goal.target);
            this.saveData();
            this.updateUI();
            
            if (goal.current >= goal.target) {
                this.showToast(`Congratulations! You've reached your "${goal.name}" goal! 🎉`, 'success');
            }
        }
    }
    
    // UI Updates
    updateUI() {
        this.updateStats();
        this.updateBudgetChart();
        this.updateCategories();
        this.updateExpenseList();
        this.updateSavingsGoals();
    }
    
    updateStats() {
        const totalSpent = this.data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalSaved = this.data.savingsGoals.reduce((sum, goal) => sum + goal.current, 0);
        const remaining = this.data.budget - totalSpent;
        
        document.getElementById('totalBudget').textContent = `$${this.data.budget.toFixed(0)}`;
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(0)}`;
        document.getElementById('totalSaved').textContent = `$${totalSaved.toFixed(0)}`;
        document.getElementById('remainingBudget').textContent = `$${remaining.toFixed(0)}`;
        
        // Update remaining budget color based on amount
        const remainingElement = document.getElementById('remainingBudget');
        if (remaining < 0) {
            remainingElement.style.color = 'var(--error-color)';
        } else if (remaining < this.data.budget * 0.1) {
            remainingElement.style.color = 'var(--alert-color)';
        } else {
            remainingElement.style.color = 'var(--success-color)';
        }
    }
    
    updateBudgetChart() {
        const ctx = document.getElementById('budgetChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const categories = Object.keys(this.data.categories);
        const budgetData = categories.map(cat => this.data.categories[cat].budget);
        const spentData = categories.map(cat => this.data.categories[cat].spent);
        const labels = categories.map(cat => this.data.categories[cat].name);
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: [
                        '#4F46E5', '#22C55E', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const category = categories[context.dataIndex];
                                const budget = budgetData[context.dataIndex];
                                const spent = spentData[context.dataIndex];
                                return `${context.label}: $${budget.toFixed(0)} (Spent: $${spent.toFixed(0)})`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';
        
        Object.entries(this.data.categories).forEach(([key, category]) => {
            const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            const isOverBudget = percentage > 100;
            
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="category-info">
                    <span class="category-icon">${category.icon}</span>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="category-amount ${isOverBudget ? 'over-budget' : ''}">
                    $${category.spent.toFixed(0)} / $${category.budget.toFixed(0)}
                </div>
            `;
            
            if (isOverBudget) {
                categoryItem.style.borderLeft = '4px solid var(--error-color)';
            }
            
            categoryList.appendChild(categoryItem);
        });
    }
    
    updateExpenseList() {
        const expenseList = document.getElementById('expenseList');
        expenseList.innerHTML = '';
        
        if (this.data.expenses.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <p>No expenses recorded yet. Add your first expense to get started!</p>
                </div>
            `;
            return;
        }
        
        // Sort expenses by date (most recent first)
        const sortedExpenses = [...this.data.expenses].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedExpenses.forEach(expense => {
            const category = this.data.categories[expense.category];
            const date = new Date(expense.date).toLocaleDateString();
            
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            expenseItem.innerHTML = `
                <div class="expense-details">
                    <div class="expense-category-icon">${category.icon}</div>
                    <div class="expense-info">
                        <h4>${expense.description}</h4>
                        <p class="expense-meta">${category.name} • ${date}</p>
                    </div>
                </div>
                <div class="expense-actions">
                    <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                    <button class="btn btn-icon btn-secondary" onclick="app.deleteExpense(${expense.id})" title="Delete expense">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            expenseList.appendChild(expenseItem);
        });
    }
    
    updateSavingsGoals() {
        const goalsGrid = document.getElementById('goalsGrid');
        goalsGrid.innerHTML = '';
        
        if (this.data.savingsGoals.length === 0) {
            goalsGrid.innerHTML = `
                <div class="empty-state">
                    <p>No savings goals yet. Create your first goal to start saving!</p>
                </div>
            `;
            return;
        }
        
        this.data.savingsGoals.forEach(goal => {
            const progress = (goal.current / goal.target) * 100;
            const isCompleted = progress >= 100;
            
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';
            goalCard.innerHTML = `
                <div class="goal-header">
                    <div>
                        <h3 class="goal-title">${goal.name}</h3>
                        <p class="goal-target">Target: $${goal.target.toFixed(0)}</p>
                    </div>
                    ${isCompleted ? '<span class="goal-badge">✅ Completed</span>' : ''}
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>$${goal.current.toFixed(0)}</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                </div>
                ${!isCompleted ? `
                    <button class="btn btn-accent btn-small add-money-btn" data-goal-id="${goal.id}">
                        Add Money
                    </button>
                ` : ''}
            `;
            
            goalsGrid.appendChild(goalCard);
        });
        
        // Add event listeners to all "Add Money" buttons
        document.querySelectorAll('.add-money-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.dataset.goalId);
                this.addToSavingsGoal(goalId);
            });
        });
    }
    
    addToSavingsGoal(goalId) {
        const amount = parseFloat(prompt('How much do you want to add to this goal?'));
        if (amount > 0) {
            this.updateSavingsGoal(goalId, amount);
        }
    }
    
    // Utility Functions
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const title = type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success';
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="toast-message">${message}</p>
        `;
        
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            this.showToast('Welcome to SmartSave! Start by setting your monthly budget.', 'success');
        }, 1000);
    }
    
    handleKeyboard(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.showBudgetModal();
                    break;
                case 'e':
                    e.preventDefault();
                    this.toggleExpenseForm();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            this.hideBudgetModal();
            this.hideExpenseForm();
        }
    }
    
    // Export/Import functionality (for future use)
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'smartsave-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!', 'success');
    }
    
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = { ...this.data, ...importedData };
                this.saveData();
                this.updateUI();
                this.showToast('Data imported successfully!', 'success');
            } catch (error) {
                this.showToast('Error importing data. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SmartSaveApp();
});

// Service Worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
