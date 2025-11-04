const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { startOfMonth, endOfMonth, addWeeks, format,} = require('date-fns')
const { Op } = require('sequelize');
const { budget_months, budget_weeks, budget_fixed_expenses, budget_expenses, budget_savings, budget_saving_logs } = require('../dbHandler');

router.use(authenticateToken);

// get all budget months for the authenticated user
router.get('/months', async (req, res) => {
  try {
    const userId = req.user.id;

    // ha a kliens megadja, használjuk azt, különben az aktuális hónapot
    const monthIndex = req.query.month ? parseInt(req.query.month) : new Date().getMonth();
    const now = new Date();
    const year = now.getFullYear();

    // adott hónap első és utolsó napja
    const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
    const lastDay = new Date(year, monthIndex + 1, 0, 12, 0, 0);

    let currentMonth = await budget_months.findOne({
      where: {
        userId,
        month: { [Op.between]: [firstDay, lastDay] },
      },
    });

    if (!currentMonth) {
      currentMonth = await budget_months.create({
        userId,
        month: firstDay,
        total_budget: 0,
        remaining_budget: 0,
      });
      console.log('Új hónap automatikusan létrehozva:', firstDay);
    }

    const allMonths = await budget_months.findAll({
      where: { userId },
      order: [['month', 'ASC']],
    });

    res.json({ allMonths, currentMonth });
  } catch (err) {
    console.error('Hiba a hónapok lekérésekor:', err);
    res.status(500).json({ message: 'Szerverhiba a hónapok lekérése során' });
  }
});

// create or update a budget month (with optional auto-week generation)
router.post('/month', async (req, res) => {
    try {
        const { month, total_budget } = req.body

        // Check if the user already has a budget for this month
        let existingMonth = await budget_months.findOne({
            where: { userId: req.user.id, month }
        })

        // Calculate total spent for this month (if any expenses exist)
        const expenses = existingMonth
            ? await budget_expenses.findAll({ where: { budgetMonthId: existingMonth.id, userId: req.user.id } })
            : []
        const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

        // If the month already exists → update the total and remaining budget
        if (existingMonth) {
            existingMonth.total_budget = total_budget
            existingMonth.remaining_budget = total_budget - totalSpent
            await existingMonth.save()
            return res.status(200).json({ message: 'Month updated', month: existingMonth })
        }

        // Create a new monthly budget
        const newMonth = await budget_months.create({
            userId: req.user.id,
            month,
            total_budget,
            remaining_budget: total_budget - totalSpent
        })

        // Automatically generate weekly budgets for this month
        const start = startOfMonth(new Date(month))
        const end = endOfMonth(new Date(month))
        const weeks = []
        let current = start
        let weekNum = 1

        // Calculate number of weeks covered by the month
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        const numberOfWeeks = Math.ceil(diffDays / 7)
        const weeklyBudget = total_budget / numberOfWeeks

        // Create individual weekly records
        for (let i = 0; i < numberOfWeeks; i++) {
            const startDate = addWeeks(start, i)
            const endDate = addWeeks(start, i + 1)
            if (startDate > end) break

            const newWeek = await budget_weeks.create({
                budgetMonthId: newMonth.id,
                week_number: weekNum++,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate > end ? end : endDate, 'yyyy-MM-dd'),
                weekly_budget: weeklyBudget,
                remaining_weekly_budget: weeklyBudget
            })
            weeks.push(newWeek)
        }

        res.status(201).json({
            message: 'Month created with auto-generated weekly budgets',
            month: newMonth,
            weeks
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create or update budget month' })
    }
})

// edit a budget month
router.put('/month/:id', async (req, res) => {
    const { total_budget } = req.body;
    try {
        const { id } = req.params;
        const month = await budget_months.findOne({
            where: { id, userId: req.user.id }
        });
        if (!month) {
            return res.status(404).json({ error: 'Budget month not found' });
        }

        // Recalculate remaining based on current expenses
        const expenses = await budget_expenses.findAll({
            where: { budgetMonthId: id, userId: req.user.id }
        });
        const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        month.total_budget = total_budget;
        month.remaining_budget = total_budget - totalSpent;
        await month.save();

        res.json({ message: 'Budget month updated successfully', month });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update budget month' });
    }
});

// get all weeks for a given month
router.get('/weeks/:monthId', async (req, res) => {
    try{
        const weeks = await budget_weeeks.findAll({
            where: { budgetMonthId: req.params.monthId},
            order: [['week_number', 'ASC']]
        })
        res.json(weeks);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch budget weeks' });
    }
})

// list all expenses for a given month
router.get('/expenses/:monthId', async (req, res) => {
    try {
        const expenses = await budget_expenses.findAll({
            where: { budgetMonthId: req.params.monthId, userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(expenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch budget expenses' });
    }
});

// add a new expense (auto update month & week balances)
router.post('/expenses', async (req, res) => {
    try {
        const { budgetMonthId, amount, description, category, currency, date } = req.body;

        // 1️⃣ Create new expense
        const newExpense = await budget_expenses.create({
            budgetMonthId,
            userId: req.user.id,
            description,
            amount,
            category,
            currency
        });

        // 2️⃣ Update monthly remaining budget
        const month = await budget_months.findByPk(budgetMonthId);
        if (month) {
            month.remaining_budget = Number(month.remaining_budget) - Number(amount);
            await month.save();
        }

        // 3️⃣ Try to find which week this expense belongs to (optional date field)
        if (date) {
            const week = await budget_weeks.findOne({
                where: {
                    budgetMonthId,
                    start_date: { [Op.lte]: date },
                    end_date: { [Op.gte]: date }
                }
            });
            if (week) {
                week.remaining_weekly_budget =
                    Number(week.remaining_weekly_budget) - Number(amount);
                await week.save();
            }
        }

        res.status(201).json({
            message: 'Expense added successfully',
            expense: newExpense
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add budget expense' });
    }
});

// edit an expense (auto update month & week balances)
router.put('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, currency } = req.body;

        const expense = await budget_expenses.findOne({
            where: { id, userId: req.user.id }
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Adjust monthly total (calculate difference)
        const month = await budget_months.findByPk(expense.budgetMonthId);
        if (month) {
            const diff = Number(amount) - Number(expense.amount);
            month.remaining_budget -= diff;
            await month.save();
        }

        // Update expense details
        expense.description = description;
        expense.amount = amount;
        expense.category = category;
        expense.currency = currency;
        await expense.save();

        res.json({ message: 'Expense updated successfully', expense });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// delete an expense (auto update month & week balances)
router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await budget_expenses.findOne({
            where: { id, userId: req.user.id }
        });

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const month = await budget_months.findByPk(expense.budgetMonthId);
        if (month) {
            month.remaining_budget = Number(month.remaining_budget) + Number(expense.amount);
            await month.save();
        }

        await expense.destroy();
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});




module.exports = router;