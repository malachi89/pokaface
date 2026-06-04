import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { config } from '../config'

const dbDir = path.dirname(config.dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(config.dbPath)

console.log('Connected to SQLite database')

db.pragma('busy_timeout = 5000')
db.pragma('foreign_keys = ON')

export async function runAsync(sql: string, params: any[] = []) {
  return db.prepare(sql).run(...params)
}

export async function getAsync(sql: string, params: any[] = []): Promise<any> {
  return db.prepare(sql).get(...params)
}

export async function allAsync(sql: string, params: any[] = []): Promise<any[]> {
  return db.prepare(sql).all(...params)
}
