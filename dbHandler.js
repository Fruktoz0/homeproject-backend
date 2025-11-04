const { Sequelize, DataTypes, DATE } = require("sequelize")
require('dotenv').config()

const dbConnection = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
    })

const users = dbConnection.define('user', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'password': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'displayName': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'email': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    'isVerified': {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    'timezone': {
        type: DataTypes.STRING,
        defaultValue: 'Europe/Budapest'
    },
    'default_unit_mass': {
        type: DataTypes.ENUM('g', 'kg'),
        defaultValue: 'g'
    },
    'default_unit_volume': {
        type: DataTypes.ENUM('ml', 'l'),
        defaultValue: 'ml'
    },
})

const shares = dbConnection.define('share', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: true,
    },
    'ownerUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'targetUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'scope': {
        type: DataTypes.ENUM('view', 'edit'),
        allowNull: false,
        defaultValue: 'view'
    },
    'scope_type': {
        type: DataTypes.ENUM('meal', 'budget'),
        allowNull: false,
    },
    'label': {
        type: DataTypes.STRING,
        allowNull: true,
    }
})

const meal_types = dbConnection.define('meal_type', {
    'id': {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: true,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'orderIndex': {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    'isDefault': {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
})

const diary_days = dbConnection.define('diary_day', {
    'id': {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'date': {
        type: DataTypes.DATE,
        allowNull: false,
    }
})

const meal_entries = dbConnection.define('meal_entry', {
    'id': {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    'diaryDayId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'mealTypeId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'foodId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'quantity_value': {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
    },
    'quantity_unit': {
        type: DataTypes.ENUM('g', 'kg', 'ml', 'l', 'piece'),
        allowNull: false,
    },
    'note': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'createdByUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
})

const foods = dbConnection.define('food', {
    'id': {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    'source': {
        type: DataTypes.ENUM('user', 'internal', 'external'),
        allowNull: false,
    },
    'externalSource': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'externalId': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'brand': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'category': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'serving_size_value': {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true
    },
    'serving_size_unit': {
        type: DataTypes.ENUM('g', 'ml', 'piece'),
        allowNull: true,
    },
    'density_g_per_ml': {
        type: DataTypes.DECIMAL(10, 5),
        allowNull: true,
    },
    'createdByUserId': {
        type: DataTypes.UUID,
        allowNull: true,
    },
    'isVerified': {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    }
})

const nutrients = dbConnection.define('nutrient', {
    'id': {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    'code': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'unit': {
        type: DataTypes.STRING,
        allowNull: false
    }
})

const food_nutrients = dbConnection.define('food_nutrient', {
    'foodId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'nutrientId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'amount_per_100g': {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
    }
})

const unit_conversions = dbConnection.define('unit_conversion', {
    'id': {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    'from_unit': {
        type: DataTypes.ENUM('g', 'kg', 'ml', 'l', 'piece'),
        allowNull: false,
    },
    'to_unit': {
        type: DataTypes.ENUM('g', 'kg', 'ml', 'l', 'piece'),
        allowNull: false,
    },
    'factor': {
        type: DataTypes.DECIMAL(12, 6),
        allowNull: false
    },
    'foodId': {
        type: DataTypes.INTEGER,
        allowNull: true
    }
})

const user_food_aliases = dbConnection.define('user_food_alias', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'foodId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'alias': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'isFavorite': {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    'tags': {
        type: DataTypes.JSON,
        allowNull: true,
    }
})

const budget_months = dbConnection.define('budget_month', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'month': {
        type: DataTypes.DATE,
        allowNull: false,
    },
    'total_budget': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
    },
    'remaining_budget': {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    }
})

const budget_weeks = dbConnection.define('budget_week', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'budgetMonthId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'week_number': {
        type: DataTypes.INTEGER,
        allowNull: false, // 1–4
    },
    'start_date': {
        type: DataTypes.DATE,
        allowNull: false,
    },
    'end_date': {
        type: DataTypes.DATE,
        allowNull: false,
    },
    'weekly_budget': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    'remaining_weekly_budget': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
})

const budget_recurring_expenses = dbConnection.define('budget_recurring_expense', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. "Villanyszámla"
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    frequency: {
        type: DataTypes.ENUM('WEEKLY', 'MONTHLY', 'YEARLY'),
        allowNull: false,
        defaultValue: 'MONTHLY',
    },
    due_day: {
        type: DataTypes.INTEGER, // e.g. 15 => every month on the 15th
        allowNull: true,
    },
    auto_apply: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // automatically adds to expenses when due
    },
    next_due_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true, // e.g. "Utilities", "Subscriptions"
    },
    payment_method: {
        type: DataTypes.ENUM('TRANSFER', 'CASH', 'CARD', 'AUTOMATIC', 'OTHER'),
        defaultValue: 'TRANSFER',
    },
    alert_days_before: {
        type: DataTypes.INTEGER,
        defaultValue: 3, // days before due_date to send alert
    },
    last_generated_expenseId: {
        type: DataTypes.INTEGER,
        allowNull: true, // link to last auto-applied expense record
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    },
});

const budget_recurring_logs = dbConnection.define('budget_recurring_log', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    recurringId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'SKIPPED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    auto_generated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // created automatically by scheduler
    },
    verified_by_user: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // user confirmed payment
    },
    amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // can differ from original (e.g. changed fee)
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    },
});

const budget_expenses = dbConnection.define('budget_expense', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'budgetMonthId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'description': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'amount': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    'category': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'currency': {
        type: DataTypes.ENUM('HUF', 'EUR', 'USD'),
        defaultValue: 'HUF',
    }
})

const budget_savings = dbConnection.define('budget_saving', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'target_amount': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    'active': {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
})

const budget_saving_logs = dbConnection.define('budget_saving_log', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    'savingId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'amount': {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    'note': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'createdByUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'active': {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
})

// Users
users.hasMany(shares, { foreignKey: 'ownerUserId' })
users.hasMany(meal_types, { foreignKey: 'userId' })
users.hasMany(diary_days, { foreignKey: 'userId' })
users.hasMany(budget_months, { foreignKey: 'userId' })
users.hasMany(budget_savings, { foreignKey: 'userId' })

// Meal relationships
diary_days.hasMany(meal_entries, { foreignKey: 'diaryDayId' })
meal_types.hasMany(meal_entries, { foreignKey: 'mealTypeId' })
foods.hasMany(meal_entries, { foreignKey: 'foodId' })
users.hasMany(meal_entries, { foreignKey: 'createdByUserId' })

// Nutrients
foods.hasMany(food_nutrients, { foreignKey: 'foodId' })
nutrients.hasMany(food_nutrients, { foreignKey: 'nutrientId' })

// Unit conversion + aliases
foods.hasMany(unit_conversions, { foreignKey: 'foodId' })
foods.hasMany(user_food_aliases, { foreignKey: 'foodId' })
users.hasMany(user_food_aliases, { foreignKey: 'userId' })

// Budget relationships
budget_months.hasMany(budget_expenses, { foreignKey: 'budgetMonthId' })
budget_weeks.belongsTo(budget_months, { foreignKey: 'budgetMonthId' })
budget_savings.hasMany(budget_saving_logs, { foreignKey: 'savingId' })
users.hasMany(budget_saving_logs, { foreignKey: 'createdByUserId' })
users.hasMany(budget_recurring_expenses, { foreignKey: 'userId' });
budget_recurring_expenses.hasMany(budget_recurring_logs, { foreignKey: 'recurringId' });
budget_recurring_logs.belongsTo(budget_recurring_expenses, { foreignKey: 'recurringId' });


module.exports = {
    dbConnection,
    users,
    shares,
    meal_types,
    diary_days,
    meal_entries,
    foods,
    nutrients,
    food_nutrients,
    unit_conversions,
    user_food_aliases,
    budget_months,
    budget_weeks,
    budget_expenses,
    budget_savings,
    budget_saving_logs,
    budget_recurring_expenses,
    budget_recurring_logs,

}
