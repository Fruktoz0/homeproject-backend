const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const crypto = require('crypto')
const { users } = require('../dbHandler')

// User registration
router.post('/register', async (req, res) => {
    const { email, password, displayName } = req.body
    try {
        const existingUser = await users.findOne({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await users.create({ email, password: hashedPassword, displayName })
        res.status(201).json({ message: 'User registered successfully', user: newUser })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await users.findOne({ where: { email } })
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }
        const token = jwt.sign({ id: user.id, email: user.email, displayName: user.displayName }, JWT_SECRET, { expiresIn: '180d' })
        res.status(200).json({ message: 'Login successful', token })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})




module.exports = router;