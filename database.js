import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function initializeDatabase() {
    if (db) return db;

    db = await open({
        filename: './atm.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            name TEXT PRIMARY KEY,
            balance REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS debts (
            debtor TEXT,
            creditor TEXT,
            amount REAL,
            PRIMARY KEY (debtor, creditor),
            FOREIGN KEY (debtor) REFERENCES customers(name),
            FOREIGN KEY (creditor) REFERENCES customers(name)
        );

        CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY,
            current_customer TEXT,
            FOREIGN KEY (current_customer) REFERENCES customers(name)
        );
    `);

    // Ensure we have exactly one session row
    const session = await db.get('SELECT * FROM session LIMIT 1');
    if (!session) {
        await db.run('INSERT INTO session (id, current_customer) VALUES (1, NULL)');
    }

    return db;
}

export async function getCurrentCustomer() {
    const db = await initializeDatabase();
    const result = await db.get('SELECT current_customer FROM session WHERE id = 1');
    return result?.current_customer;
}

export async function setCurrentCustomer(name) {
    const db = await initializeDatabase();
    await db.run('UPDATE session SET current_customer = ? WHERE id = 1', name);
}

export async function createCustomer(name) {
    const db = await initializeDatabase();
    await db.run('INSERT OR IGNORE INTO customers (name) VALUES (?)', name);
}

export async function getCustomerBalance(name) {
    const db = await initializeDatabase();
    const result = await db.get('SELECT balance FROM customers WHERE name = ?', name);
    return result?.balance || 0;
}

export async function updateBalance(name, amount) {
    const db = await initializeDatabase();
    await db.run('UPDATE customers SET balance = balance + ? WHERE name = ?', amount, name);
}

export async function getDebts(name) {
    const db = await initializeDatabase();
    const owes = await db.all('SELECT creditor, amount FROM debts WHERE debtor = ?', name);
    const owed = await db.all('SELECT debtor, amount FROM debts WHERE creditor = ?', name);
    return { owes, owed };
}

export async function updateDebt(debtor, creditor, amount) {
    const db = await initializeDatabase();
    if (amount > 0) {
        await db.run(
            'INSERT OR REPLACE INTO debts (debtor, creditor, amount) VALUES (?, ?, ?)',
            debtor, creditor, amount
        );
    } else {
        await db.run(
            'DELETE FROM debts WHERE debtor = ? AND creditor = ?',
            debtor, creditor
        );
    }
}
