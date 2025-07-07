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
        this.currentChatCategory = null;
        this.chatSessions = {}; // Store chat history for each category
        
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
        
        // AI Assistant chat modals
        document.querySelectorAll('.ai-assistant-circle').forEach(circle => {
            circle.addEventListener('click', (e) => this.openAIChat(e.currentTarget.dataset.category, e.currentTarget.dataset.name));
        });
        
        document.getElementById('closeChatModal').addEventListener('click', () => this.closeChatModal());
        document.getElementById('chatModalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeChatModal();
            }
        });
        
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
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
    
    // AI Chat System
    openAIChat(category, name) {
        this.currentChatCategory = category;
        
        // Initialize chat session if it doesn't exist
        if (!this.chatSessions[category]) {
            this.chatSessions[category] = [];
            this.addWelcomeMessage(category, name);
        }
        
        // Update chat modal header
        this.updateChatHeader(category, name);
        
        // Display chat history
        this.displayChatMessages();
        
        // Show modal
        document.getElementById('chatModalOverlay').classList.add('active');
        document.getElementById('chatInput').focus();
    }
    
    closeChatModal() {
        document.getElementById('chatModalOverlay').classList.remove('active');
        this.currentChatCategory = null;
    }
    
    updateChatHeader(category, name) {
        const iconMap = {
            'subscription': '📱',
            'personal-care': '🛍️',
            'entertainment': '🎮',
            'food': '🍔',
            'transport': '🚌'
        };
        
        const specialtyMap = {
            'subscription': 'Phone & Subscription Expert',
            'personal-care': 'Shopping & Personal Care Advisor',
            'entertainment': 'Entertainment & Hobbies Guide',
            'food': 'Food & Nutrition Specialist',
            'transport': 'Transportation Consultant'
        };
        
        document.getElementById('chatAssistantIcon').textContent = iconMap[category];
        document.getElementById('chatAssistantName').textContent = name;
        document.getElementById('chatAssistantSpecialty').textContent = specialtyMap[category];
        
        // Update header gradient color based on category
        const header = document.querySelector('.chat-header');
        const gradientMap = {
            'subscription': 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
            'personal-care': 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
            'entertainment': 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
            'food': 'linear-gradient(135deg, var(--alert-color), var(--alert-light))',
            'transport': 'linear-gradient(135deg, #06B6D4, #67E8F9)'
        };
        header.style.background = gradientMap[category];
    }
    
    addWelcomeMessage(category, name) {
        const welcomeMessages = {
            'subscription': `Hi! I'm your Phone Subscription advisor. I can help you find the best phone plans, manage your data usage, and optimize your subscription costs. What would you like to know?`,
            'personal-care': `Hello! I'm here to help with personal care and shopping budgets. I can suggest affordable beauty products, smart shopping strategies, and ways to save on essentials. How can I assist you?`,
            'entertainment': `Hey there! I'm your Entertainment & Hobbies guide. I can recommend budget-friendly activities, free entertainment options, and ways to enjoy your hobbies without overspending. What interests you?`,
            'food': `Hi! I'm your Food & Nutrition specialist. I can help with meal planning, budget recipes, grocery shopping tips, and finding the best student meal deals. What would you like to discuss?`,
            'transport': `Hello! I'm your Transportation consultant. I can help you save on commuting costs, find the best transport deals, and plan efficient routes. How can I help you today?`
        };
        
        this.addMessageToChat(category, welcomeMessages[category], 'assistant');
    }
    
    addMessageToChat(category, message, sender, timestamp = new Date()) {
        this.chatSessions[category].push({
            message,
            sender,
            timestamp
        });
    }
    
    displayChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        if (!this.chatSessions[this.currentChatCategory]) {
            return;
        }
        
        this.chatSessions[this.currentChatCategory].forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${msg.sender}`;
            
            const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.innerHTML = `
                <div>${msg.message}</div>
                <div class="chat-message-time">${time}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || !this.currentChatCategory) return;
        
        // Add user message
        this.addMessageToChat(this.currentChatCategory, message, 'user');
        input.value = '';
        
        // Display updated messages
        this.displayChatMessages();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate AI response after a delay
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(this.currentChatCategory, message);
            this.addMessageToChat(this.currentChatCategory, response, 'assistant');
            this.displayChatMessages();
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    }
    
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <span>AI Assistant is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    generateAIResponse(category, userMessage) {
        const message = userMessage.toLowerCase();
        
        // Get user's spending data for this category
        const categoryData = this.data.categories[category];
        const spent = categoryData ? categoryData.spent : 0;
        const budget = categoryData ? categoryData.budget : 0;
        const usage = budget > 0 ? (spent / budget) * 100 : 0;
        
        // Category-specific responses
        const responses = {
            'subscription': this.getSubscriptionResponse(message, spent, budget, usage),
            'personal-care': this.getPersonalCareResponse(message, spent, budget, usage),
            'entertainment': this.getEntertainmentResponse(message, spent, budget, usage),
            'food': this.getFoodResponse(message, spent, budget, usage),
            'transport': this.getTransportResponse(message, spent, budget, usage)
        };
        
        return responses[category] || this.getGenericResponse(message, spent, budget, usage);
    }
    
    getSubscriptionResponse(message, spent, budget, usage) {
        if (message.includes('plan') || message.includes('phone')) {
            return `For students, I recommend looking into student discount plans. Many carriers offer 20-30% off for students. Based on your current spending of $${spent.toFixed(0)}, consider plans with unlimited data around $25-35/month.`;
        }
        if (message.includes('data') || message.includes('usage')) {
            return `To manage data usage: Use WiFi whenever possible, download content at home, and check your usage regularly. Most students need 3-8GB per month unless streaming heavily.`;
        }
        if (message.includes('save') || message.includes('cheap')) {
            return `Money-saving tips: Consider prepaid plans, family plans with friends, or budget carriers like Mint Mobile. You could save $10-20/month compared to major carriers.`;
        }
        if (usage > 80) {
            return `You've used ${usage.toFixed(0)}% of your subscription budget. Consider switching to a cheaper plan or sharing a family plan to reduce costs.`;
        }
        return `I can help with phone plans, data management, and subscription optimization. What specific aspect would you like advice on?`;
    }
    
    getPersonalCareResponse(message, spent, budget, usage) {
        if (message.includes('save') || message.includes('budget')) {
            return `Smart shopping tips: Buy generic brands (save 30-50%), use student discounts, shop sales, and buy in bulk for non-perishables. Your current spending is $${spent.toFixed(0)}.`;
        }
        if (message.includes('product') || message.includes('beauty')) {
            return `For affordable personal care: Drugstore brands often match expensive ones. CeraVe, The Ordinary, and E.L.F. offer quality at student-friendly prices.`;
        }
        if (message.includes('deals') || message.includes('discount')) {
            return `Best deals: Sign up for store loyalty programs, use apps like Honey for coupons, shop end-of-season sales, and check student discount portals like UNiDAYS.`;
        }
        if (usage > 80) {
            return `You've spent ${usage.toFixed(0)}% of your personal care budget. Try DIY alternatives, buy only essentials this month, or look for generic substitutes.`;
        }
        return `I can help with budget shopping strategies, product recommendations, and finding the best deals. What are you looking to buy or save on?`;
    }
    
    getEntertainmentResponse(message, spent, budget, usage) {
        if (message.includes('free') || message.includes('cheap')) {
            return `Free entertainment ideas: Campus events, free museum days, hiking, YouTube/podcasts, library programs, and student club activities. Many offer great experiences at no cost!`;
        }
        if (message.includes('movie') || message.includes('streaming')) {
            return `For movies: Use student discounts at theaters, share streaming subscriptions with friends, or catch matinee showings. Consider one streaming service at a time instead of multiple.`;
        }
        if (message.includes('hobby') || message.includes('activity')) {
            return `Budget hobbies: Reading (library), cooking, exercising outdoors, learning online skills (YouTube/free courses), photography with your phone, or joining student clubs.`;
        }
        if (usage > 80) {
            return `You've used ${usage.toFixed(0)}% of your entertainment budget. Focus on free activities this month - campus events, nature walks, or free community programs.`;
        }
        return `I can suggest budget-friendly entertainment, free activities, and ways to enjoy hobbies affordably. What type of entertainment interests you?`;
    }
    
    getFoodResponse(message, spent, budget, usage) {
        if (message.includes('meal') || message.includes('cook')) {
            return `Budget meal planning: Cook in batches, use seasonal ingredients, try one-pot meals, and prep on Sundays. Pasta, rice, beans, and eggs are your best friends for cheap protein and carbs.`;
        }
        if (message.includes('grocery') || message.includes('shop')) {
            return `Smart grocery shopping: Make a list, shop sales, buy generic brands, avoid shopping when hungry, and consider discount stores like Aldi. Your food spending is $${spent.toFixed(0)}.`;
        }
        if (message.includes('recipe') || message.includes('cheap')) {
            return `Cheap, nutritious recipes: Pasta with marinara and veggies, rice and bean bowls, egg fried rice, banana oat pancakes, and vegetable stir-fries. All under $3 per serving!`;
        }
        if (usage > 80) {
            return `You've spent ${usage.toFixed(0)}% of your food budget. Focus on basics: rice, pasta, beans, eggs, seasonal vegetables, and generic brands for the rest of the month.`;
        }
        return `I can help with meal planning, budget recipes, grocery shopping tips, and student meal deals. What aspect of food budgeting interests you most?`;
    }
    
    getTransportResponse(message, spent, budget, usage) {
        if (message.includes('bus') || message.includes('public')) {
            return `Public transport savings: Get a student transit pass, use monthly passes instead of daily tickets, and check if your school offers free campus shuttles. Many cities offer 50% student discounts.`;
        }
        if (message.includes('bike') || message.includes('walk')) {
            return `Active transport: Biking and walking are free! Many campuses have bike-share programs. Weather permitting, these options save money and keep you fit.`;
        }
        if (message.includes('gas') || message.includes('car')) {
            return `If you drive: Use apps like GasBuddy for cheap gas, carpool with friends, combine errands into one trip, and keep your car maintained for better fuel efficiency.`;
        }
        if (usage > 80) {
            return `You've used ${usage.toFixed(0)}% of your transport budget. Consider walking/biking more, carpooling, or using student transit discounts for the rest of the month.`;
        }
        return `I can help with public transport savings, alternative transportation options, and reducing commuting costs. What's your main transportation challenge?`;
    }
    
    getGenericResponse(message, spent, budget, usage) {
        if (message.includes('budget') || message.includes('save')) {
            return `Your current spending in this category is $${spent.toFixed(0)} out of $${budget.toFixed(0)} budgeted (${usage.toFixed(0)}% used). I can provide specific tips to help you optimize this spending.`;
        }
        return `I'm here to help with budgeting advice specific to this category. Could you be more specific about what you'd like help with?`;
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
            this.closeChatModal();
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
