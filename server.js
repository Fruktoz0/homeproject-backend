require('dotenv').config()
const express = require('express')
const server = express()
const PORT = process.env.PORT

const dbHandler = require('./dbHandler')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/usersRoutes')
const budgetRoutes = require('./routes/budgetRoutes');
const budgetRecurringRoutes = require('./routes/budgetRecurringRoutes');

server.use(cors());
server.use(express.json());
server.use('/auth', authRoutes);
server.use('/users', userRoutes);
server.use('/budget', budgetRoutes);
server.use('/budget/recurring', budgetRecurringRoutes);


(async () => {
    try {
        await dbHandler.dbConnection.sync({ alter: true })

        server.listen(PORT, () => {
            console.log(`\n A szerver a ${PORT}-es porton fut`)
        })
    } catch (err) {
        console.log("Adatbázis kapcsolódási hiba", err)
    }
})()