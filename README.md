# ATM CLI Simulation

A command-line interface simulation of an ATM system with persistent storage using SQLite.

## Features

- User authentication (login/logout)
- Account balance management
- Money transfers between users
- Debt tracking system
- Persistent data storage using SQLite
- Colorful console output

## Technology Stack

- **Node.js** - Runtime environment
- **SQLite3** - Database for persistent storage
- **Commander.js** - CLI framework
- **Chalk** - Terminal string styling
- **Jest** - Testing framework

## Database Schema

The application uses SQLite with the following tables:

1. `customers`
   - `name` (TEXT PRIMARY KEY)
   - `balance` (REAL)

2. `debts`
   - `debtor` (TEXT)
   - `creditor` (TEXT)
   - `amount` (REAL)

3. `session`
   - `id` (INTEGER PRIMARY KEY)
   - `current_customer` (TEXT)

## Installation

```bash
# Install dependencies
npm install

# The database will be automatically created on first run
```

## Usage

### Available Commands

1. Login/Create Account
```bash
node index.js login [name]
```

2. Deposit Money
```bash
node index.js deposit [amount]
```

3. Withdraw Money
```bash
node index.js withdraw [amount]
```

4. Transfer Money
```bash
node index.js transfer [target] [amount]
```

5. Logout
```bash
node index.js logout
```

### Example Session

```bash
$ node index.js login Alice
Hello, Alice!
Your balance is $0

$ node index.js deposit 100
Your balance is $100

$ node index.js transfer Bob 50
Transferred $50 to Bob
Your balance is $50

$ node index.js logout
Goodbye, Alice!
```

## Development

### Running Tests

```bash
npm test
```

### Project Structure

- `index.js` - Main CLI application
- `database.js` - Database operations and business logic
- `database.test.js` - Unit tests
- `atm.db` - SQLite database file (created on first run)

## Unit Testing

Proyek ini menggunakan Jest sebagai framework testing. Berikut cara menjalankan unit test:

### Menjalankan Test

```bash
# Menjalankan semua test
npm test

# Menjalankan test spesifik file
npm test -- filename.test.js

# Menjalankan test dalam mode watch (otomatis test ketika ada perubahan)
npm test -- --watch

# Menjalankan test dengan nama tertentu
npm test -- -t "nama test"
```

### Struktur Test

Jest akan otomatis mencari dan menjalankan file test dengan pola nama:
- `*.test.js`
- `*.spec.js`
- File di dalam folder `__tests__`

### Contoh Test Case

```javascript
describe('Contoh Test Suite', () => {
    test('seharusnya mengembalikan true', () => {
        expect(true).toBe(true);
    });

    test('seharusnya bisa menjumlahkan dua angka', () => {
        const hasil = 2 + 2;
        expect(hasil).toBe(4);
    });
});
```