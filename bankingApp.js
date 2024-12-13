
// bankingApp.js
const fs = require('fs');
const inquirer = require('inquirer');
const User = require('./user');
const ETransfer = require('./etransfer');
const path = './data/users.json';

class BankingApp {
    constructor() {
        this.users = [];
        this.pendingTransfers = [];
        this.loadData();
    }

    loadData() {
        if (fs.existsSync(path)) {
            const data = fs.readFileSync(path, 'utf-8');
            let usersData;
            try {
                usersData = JSON.parse(data);
            } catch (error) {
                console.error("Error parsing users.json:", error);
                return;
            }

            console.log('Loaded users data:', usersData);

            if (usersData.users && Array.isArray(usersData.users)) {
                this.users = usersData.users.map(user => {
                    console.log(`User loaded: ${user.username}, PIN: ${user.PIN}`); // Debugging line
                    return new User(user.username, user.PIN.toString(), user.balance);
                });
            } else {
                console.log("No users data found in users.json.");
                this.users = [];
            }

            if (usersData.pendingTransfers && Array.isArray(usersData.pendingTransfers)) {
                this.pendingTransfers = usersData.pendingTransfers.map(transferData => {
                    const sender = this.users.find(u => u.username === transferData.sender?.username);
                    const recipient = this.users.find(u => u.username === transferData.recipient?.username);
                    return new ETransfer(sender, recipient, transferData.amount, transferData.securityQuestion, transferData.securityAnswer);
                });
            } else {
                console.log("No pending transfers found in users.json.");
                this.pendingTransfers = [];
            }
        } else {
            console.log('users.json not found.');
        }
    }

    saveData() {
        const usersData = this.users.map(user => ({
            username: user.username,
            PIN: user.PIN,
            balance: user.balance
        }));
        fs.writeFileSync(path, JSON.stringify({ users: usersData, pendingTransfers: this.pendingTransfers }, null, 2));
    }

    async authenticateUser() {
        const prompt = inquirer.createPromptModule();
        let attempts = 0;
        while (attempts < 3) {
            const { username, PIN } = await prompt([
                { name: 'username', message: 'Enter your username:' },
                { name: 'PIN', type: 'password', message: 'Enter your PIN:' }
            ]);

            console.log(`Entered username: ${username}, Entered PIN: ${PIN}`); // Debugging line

            const user = this.users.find(u => u.username === username);

            if (user) {
                console.log(`Found user: ${user.username}, Stored PIN: ${user.PIN}`); // Debugging line
                if (user.authenticate(PIN)) {
                    console.log('Authentication successful!');
                    return user;
                } else {
                    console.log('Incorrect PIN.');
                }
            } else {
                console.log(`User with username ${username} not found.`);
            }

            attempts++;
            console.log('Incorrect username or PIN. Try again.');
        }

        console.log('Too many failed attempts. Exiting...');
        process.exit();
    }

    async mainMenu(user) {
        const prompt = inquirer.createPromptModule();
        const actions = [
            'Withdraw Funds',
            'Deposit Funds',
            'View Balance',
            'Send E-Transfer',
            'Accept E-Transfer',
            'Change PIN',
            'Exit'
        ];

        while (true) {
            const { action } = await prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'Choose an action:',
                    choices: actions
                }
            ]);

            switch (action) {
                case 'Withdraw Funds':
                    await this.withdrawFunds(user);
                    break;
                case 'Deposit Funds':
                    await this.depositFunds(user);
                    break;
                case 'View Balance':
                    console.log(`Your balance: $${user.viewBalance()}`);
                    break;
                case 'Send E-Transfer':
                    await this.sendETransfer(user);
                    break;
                case 'Accept E-Transfer':
                    await this.acceptETransfer(user);
                    break;
                case 'Change PIN':
                    await this.changePIN(user);
                    break;
                case 'Exit':
                    this.saveData();
                    console.log('Thank you for using the banking application!');
                    process.exit();
                    break;
            }
        }
    }

    async withdrawFunds(user) {
        const prompt = inquirer.createPromptModule();
        const { amount } = await prompt([
            { name: 'amount', message: 'Enter amount to withdraw:' }
        ]);
        user.withdraw(parseFloat(amount));
        console.log(`Updated balance: $${user.viewBalance()}`);
    }

    async depositFunds(user) {
        const prompt = inquirer.createPromptModule();
        const { amount } = await prompt([
            { name: 'amount', message: 'Enter amount to deposit:' }
        ]);
        user.deposit(parseFloat(amount));
        console.log(`Updated balance: $${user.viewBalance()}`);
    }

    async sendETransfer(user) {
        const prompt = inquirer.createPromptModule();
        const { recipient, amount, securityQuestion, securityAnswer } = await prompt([
            { name: 'recipient', message: 'Enter recipient email:' },
            { name: 'amount', message: 'Enter amount to send:' },
            { name: 'securityQuestion', message: 'Enter a security question:' },
            { name: 'securityAnswer', message: 'Enter a security answer:' }
        ]);

        const recipientUser = this.users.find(u => u.username === recipient);
        if (!recipientUser) {
            console.log('Recipient not found!');
            return;
        }

        const transfer = new ETransfer(user, recipientUser, parseFloat(amount), securityQuestion, securityAnswer);
        this.pendingTransfers.push(transfer);
        user.withdraw(parseFloat(amount));

        console.log(`Transfer to ${recipientUser.username} completed. Pending transfer awaiting acceptance.`);
    }

    async acceptETransfer(user) {
        const prompt = inquirer.createPromptModule();

        // Filter transfers for the current user
        const pending = this.pendingTransfers.filter(t => t.recipient?.username === user.username);

        if (pending.length === 0) {
            console.log('No pending e-transfers.');
            return;
        }

        // Allow the user to select a transfer to accept
        const { selectedTransferIndex } = await prompt([
            {
                type: 'list',
                name: 'selectedTransferIndex',
                message: 'Select a transfer to accept:',
                choices: pending.map((t, index) => ({
                    name: `From: ${t.sender?.username || 'Unknown'} | Amount: $${t.amount} | Question: ${t.securityQuestion}`,
                    value: index
                }))
            }
        ]);

        const transfer = pending[selectedTransferIndex];

        const { securityAnswer } = await prompt([
            { name: 'securityAnswer', message: `Enter answer for security question: ${transfer.securityQuestion}` }
        ]);

        if (transfer.acceptETransfer(securityAnswer)) {
            user.deposit(transfer.amount);
            console.log(`Transfer accepted. Updated balance: $${user.viewBalance()}`);

            // Remove the transfer from pendingTransfers
            this.pendingTransfers.splice(this.pendingTransfers.indexOf(transfer), 1);
        } else {
            console.log('Incorrect security answer.');
        }
    }

    async changePIN(user) {
        const prompt = inquirer.createPromptModule();
        const { newPIN } = await prompt([
            { name: 'newPIN', message: 'Enter a new PIN:' }
        ]);
        user.PIN = newPIN;
        console.log('PIN changed successfully!');
    }
}

module.exports = BankingApp;