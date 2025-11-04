const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { Op } = require('sequelize');
const { budget_recurring_expenses, budget_recurring_logs } = require('../dbHandler');

router.use(authenticateToken);

// Create a new recurring expense
router.post('/', async (req, res) => {
  try {
    const { name, description, amount, frequency, due_day, category, payment_method, auto_apply, alert_days_before } = req.body;

    const newExpense = await budget_recurring_expenses.create({
      userId: req.user.id,
      name,
      description,
      amount,
      frequency,
      due_day,
      category,
      payment_method,
      auto_apply,
      alert_days_before,
      next_due_date: due_day
        ? new Date(new Date().getFullYear(), new Date().getMonth(), due_day)
        : null,
    });

    res.status(201).json({ message: 'Recurring expense created', expense: newExpense });
  } catch (err) {
    console.error('Error creating recurring expense:', err);
    res.status(500).json({ error: 'Failed to create recurring expense' });
  }
});

// Get all recurring expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await budget_recurring_expenses.findAll({
      where: { userId: req.user.id, active: true },
      include: [{ model: budget_recurring_logs, required: false }],
      order: [['next_due_date', 'ASC']],
    });

    res.json(expenses);
  } catch (err) {
    console.error('Error fetching recurring expenses:', err);
    res.status(500).json({ error: 'Failed to fetch recurring expenses' });
  }
});

//Get one recurring expense by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await budget_recurring_expenses.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: budget_recurring_logs, required: false }],
    });

    if (!expense) return res.status(404).json({ error: 'Recurring expense not found' });
    res.json(expense);
  } catch (err) {
    console.error('Error fetching recurring expense:', err);
    res.status(500).json({ error: 'Failed to fetch recurring expense' });
  }
});

// Update a recurring expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      amount,
      frequency,
      due_day,
      category,
      payment_method,
      auto_apply,
      alert_days_before,
      active,
    } = req.body;

    const expense = await budget_recurring_expenses.findOne({
      where: { id, userId: req.user.id },
    });

    if (!expense) return res.status(404).json({ error: 'Recurring expense not found' });

    Object.assign(expense, {
      name,
      description,
      amount,
      frequency,
      due_day,
      category,
      payment_method,
      auto_apply,
      alert_days_before,
      active,
    });

    await expense.save();
    res.json({ message: 'Recurring expense updated successfully', expense });
  } catch (err) {
    console.error('Error updating recurring expense:', err);
    res.status(500).json({ error: 'Failed to update recurring expense' });
  }
});

//Delete a recurring expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await budget_recurring_expenses.findOne({
      where: { id, userId: req.user.id },
    });

    if (!expense) return res.status(404).json({ error: 'Recurring expense not found' });

    expense.active = false;
    await expense.save();
    res.json({ message: 'Recurring expense deactivated successfully' });
  } catch (err) {
    console.error('Error deactivating recurring expense:', err);
    res.status(500).json({ error: 'Failed to deactivate recurring expense' });
  }
});

//Mark as paid
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date, amount_paid, note } = req.body;

    const expense = await budget_recurring_expenses.findOne({
      where: { id, userId: req.user.id },
    });

    if (!expense) return res.status(404).json({ error: 'Recurring expense not found' });

    const newLog = await budget_recurring_logs.create({
      recurringId: expense.id,
      due_date: due_date || new Date(),
      status: 'PAID',
      paid_at: new Date(),
      note,
      amount_paid: amount_paid || expense.amount,
      verified_by_user: true,
    });

    // update next_due_date
    const current = new Date(expense.next_due_date || new Date());
    if (expense.frequency === 'MONTHLY') {
      current.setMonth(current.getMonth() + 1);
    } else if (expense.frequency === 'WEEKLY') {
      current.setDate(current.getDate() + 7);
    } else if (expense.frequency === 'YEARLY') {
      current.setFullYear(current.getFullYear() + 1);
    }
    expense.next_due_date = current;
    await expense.save();

    res.json({ message: 'Recurring expense marked as paid', log: newLog });
  } catch (err) {
    console.error('Error marking recurring expense as paid:', err);
    res.status(500).json({ error: 'Failed to mark recurring expense as paid' });
  }
});

//List upcoming // due expenses
router.get('/upcoming/list', async (req, res) => {
  try {
    const today = new Date();
    const upcoming = await budget_recurring_expenses.findAll({
      where: {
        userId: req.user.id,
        active: true,
        next_due_date: {
          [Op.lte]: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
        },
      },
      order: [['next_due_date', 'ASC']],
    });

    res.json(upcoming);
  } catch (err) {
    console.error('Error fetching upcoming recurring expenses:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming recurring expenses' });
  }
});

module.exports = router;