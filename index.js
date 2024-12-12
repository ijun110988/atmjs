#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
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

const program = new Command();

program
    .name('atm-cli')
    .description('CLI ATM simulation')
    .version('1.0.0');

program
    .command('login')
    .argument('<name>', 'customer name')
    .action(async (name) => {
        const currentCustomer = await getCurrentCustomer();
        if (currentCustomer) {
            console.log(chalk.red('Please logout first!'));
            return;
        }

        await createCustomer(name);
        await setCurrentCustomer(name);
        
        console.log(chalk.green(`Hello, ${name}!`));
        await displayBalance(name);
    });

program
    .command('deposit')
    .argument('<amount>', 'amount to deposit')
    .action(async (amount) => {
        const currentCustomer = await getCurrentCustomer();
        if (!currentCustomer) {
            console.log(chalk.red('Please login first!'));
            return;
        }

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            console.log(chalk.red('Please enter a valid positive amount!'));
            return;
        }

        // Check for debts and settle them first
        const { owes } = await getDebts(currentCustomer);
        let remainingDeposit = depositAmount;

        for (const debt of owes) {
            if (remainingDeposit <= 0) break;

            const settleAmount = Math.min(remainingDeposit, debt.amount);
            await updateBalance(debt.creditor, settleAmount);
            await updateDebt(currentCustomer, debt.creditor, debt.amount - settleAmount);
            remainingDeposit -= settleAmount;
            
            console.log(chalk.yellow(`Transferred $${settleAmount} to ${debt.creditor}`));
        }

        if (remainingDeposit > 0) {
            await updateBalance(currentCustomer, remainingDeposit);
        }

        await displayBalance(currentCustomer);
    });

program
    .command('withdraw')
    .argument('<amount>', 'amount to withdraw')
    .action(async (amount) => {
        const currentCustomer = await getCurrentCustomer();
        if (!currentCustomer) {
            console.log(chalk.red('Please login first!'));
            return;
        }

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            console.log(chalk.red('Please enter a valid positive amount!'));
            return;
        }

        const balance = await getCustomerBalance(currentCustomer);
        if (withdrawAmount > balance) {
            console.log(chalk.red('Insufficient funds!'));
            return;
        }

        await updateBalance(currentCustomer, -withdrawAmount);
        await displayBalance(currentCustomer);
    });

program
    .command('transfer')
    .argument('<target>', 'target customer')
    .argument('<amount>', 'amount to transfer')
    .action(async (target, amount) => {
        const currentCustomer = await getCurrentCustomer();
        if (!currentCustomer) {
            console.log(chalk.red('Please login first!'));
            return;
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            console.log(chalk.red('Please enter a valid positive amount!'));
            return;
        }

        const balance = await getCustomerBalance(currentCustomer);
        
        if (transferAmount <= balance) {
            await updateBalance(currentCustomer, -transferAmount);
            await updateBalance(target, transferAmount);
            console.log(chalk.green(`Transferred $${transferAmount} to ${target}`));
        } else {
            const remainingAmount = transferAmount - balance;
            if (balance > 0) {
                await updateBalance(currentCustomer, -balance);
                await updateBalance(target, balance);
                console.log(chalk.yellow(`Transferred $${balance} to ${target}`));
            }
            
            // Record the debt
            await updateDebt(currentCustomer, target, remainingAmount);
        }

        await displayBalance(currentCustomer);
    });

program
    .command('logout')
    .action(async () => {
        const currentCustomer = await getCurrentCustomer();
        if (!currentCustomer) {
            console.log(chalk.red('No customer is logged in!'));
            return;
        }

        console.log(chalk.green(`Goodbye, ${currentCustomer}!`));
        await setCurrentCustomer(null);
    });

async function displayBalance(customerName) {
    const balance = await getCustomerBalance(customerName);
    console.log(chalk.blue(`Your balance is $${balance}`));

    const { owes, owed } = await getDebts(customerName);

    // Display debts
    for (const debt of owes) {
        console.log(chalk.yellow(`Owed $${debt.amount} to ${debt.creditor}`));
    }

    // Display money owed to this customer
    for (const debt of owed) {
        console.log(chalk.green(`Owed $${debt.amount} from ${debt.debtor}`));
    }
}

// Initialize database before parsing commands
(async () => {
    await initializeDatabase();
    program.parse();
})();
