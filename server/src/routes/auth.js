// server/src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    )
    res.status(201).json({ token: signToken(rows[0]), user: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    res.json({ token: signToken(user), user: { id: user.id, email: user.email } })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router