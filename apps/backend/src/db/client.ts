import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import { config } from '../config'

const dbDir = path.dirname(config.dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) console.error('Database connection error:', err)
  else console.log('Connected to SQLite database')
})

db.configure('busyTimeout', 5000)
db.run('PRAGMA foreign_keys = ON')

export function runAsync(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function getAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function allAsync(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}
