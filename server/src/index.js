// server/src/index.js
import express from 'express'
import 'dotenv/config'
import pool from './db.js'

const app = express()
app.use(express.json())

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (err) {
    res.status(500).json({ status: 'db_error', error: err.message })
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})