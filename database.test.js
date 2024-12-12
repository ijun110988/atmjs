import {
    initializeDatabase,
    getCurrentCustomer,
    setCurrentCustomer,
    createCustomer,
    getCustomerBalance,
    updateBalance,
    getDebts,
    updateDebt
} from './database.js';

describe('ATM Database Operations', () => {
    beforeEach(async () => {
        const db = await initializeDatabase();
        // Clear all tables before each test
        await db.exec(`
            DELETE FROM debts;
            DELETE FROM customers;
            UPDATE session SET current_customer = NULL WHERE id = 1;
        `);
    });

    test('should create a new customer', async () => {
        await createCustomer('Alice');
        const balance = await getCustomerBalance('Alice');
        expect(balance).toBe(0);
    });

    test('should manage customer session', async () => {
        await createCustomer('Bob');
        await setCurrentCustomer('Bob');
        const currentCustomer = await getCurrentCustomer();
        expect(currentCustomer).toBe('Bob');
    });

    test('should update customer balance', async () => {
        await createCustomer('Charlie');
        await updateBalance('Charlie', 100);
        const balance = await getCustomerBalance('Charlie');
        expect(balance).toBe(100);
    });

    test('should handle debt between customers', async () => {
        await createCustomer('David');
        await createCustomer('Eve');
        await updateDebt('David', 'Eve', 50);
        
        const davidsDebts = await getDebts('David');
        expect(davidsDebts.owes[0].creditor).toBe('Eve');
        expect(davidsDebts.owes[0].amount).toBe(50);
        
        const evesDebts = await getDebts('Eve');
        expect(evesDebts.owed[0].debtor).toBe('David');
        expect(evesDebts.owed[0].amount).toBe(50);
    });

    test('should clear debt when fully paid', async () => {
        await createCustomer('Frank');
        await createCustomer('Grace');
        await updateDebt('Frank', 'Grace', 50);
        await updateDebt('Frank', 'Grace', 0);
        
        const franksDebts = await getDebts('Frank');
        expect(franksDebts.owes.length).toBe(0);
    });

    test('should handle debit operation correctly', async () => {
        // Setup: Buat customer dengan saldo awal
        await createCustomer('John');
        await updateBalance('John', 1000);

        // Test debit operation
        await updateBalance('John', -500); // debit 500
        const balanceAfterDebit = await getCustomerBalance('John');
        expect(balanceAfterDebit).toBe(500);

        // Debit operation yang membuat saldo negatif
        await updateBalance('John', -700);
        const negativeBalance = await getCustomerBalance('John');
        expect(negativeBalance).toBe(-200);
    });

    test('should validate balance before debit', async () => {
        // Setup
        await createCustomer('ValidateUser');
        await updateBalance('ValidateUser', 100);

        // Get initial balance
        const initialBalance = await getCustomerBalance('ValidateUser');
        expect(initialBalance).toBe(100);

        // Attempt debit
        const debitAmount = -50;
        if (initialBalance + debitAmount >= 0) {
            await updateBalance('ValidateUser', debitAmount);
        }

        // Check final balance
        const finalBalance = await getCustomerBalance('ValidateUser');
        expect(finalBalance).toBe(50);
    });

    test('should handle credit operation correctly', async () => {
        // Setup: Buat customer
        await createCustomer('Jane');
        
        // Test credit operation
        await updateBalance('Jane', 1000); // credit 1000
        const balanceAfterCredit = await getCustomerBalance('Jane');
        expect(balanceAfterCredit).toBe(1000);

        // Test multiple credit operations
        await updateBalance('Jane', 500); // credit tambahan 500
        const finalBalance = await getCustomerBalance('Jane');
        expect(finalBalance).toBe(1500);
    });

    test('should handle transfer between accounts', async () => {
        // Setup: Buat dua customer
        await createCustomer('Sender');
        await createCustomer('Receiver');
        await updateBalance('Sender', 1000);

        // Test transfer
        await updateBalance('Sender', -500); // debit dari pengirim
        await updateBalance('Receiver', 500); // credit ke penerima

        const senderBalance = await getCustomerBalance('Sender');
        const receiverBalance = await getCustomerBalance('Receiver');

        expect(senderBalance).toBe(500);
        expect(receiverBalance).toBe(500);
    });

    test('should handle debt creation and payment', async () => {
        // Setup: Buat dua customer
        await createCustomer('Debtor');
        await createCustomer('Creditor');
        await updateBalance('Debtor', 1000);

        // Buat hutang
        await updateDebt('Debtor', 'Creditor', 300);
        
        // Cek hutang tercatat
        const debtorDebts = await getDebts('Debtor');
        expect(debtorDebts.owes[0].creditor).toBe('Creditor');
        expect(debtorDebts.owes[0].amount).toBe(300);

        // Bayar hutang
        await updateBalance('Debtor', -300); // debit dari debtor
        await updateBalance('Creditor', 300); // credit ke creditor
        await updateDebt('Debtor', 'Creditor', -300); // kurangi hutang

        // Cek hutang setelah dibayar
        const updatedDebts = await getDebts('Debtor');
        expect(updatedDebts.owes.length).toBe(0);
    });
});
