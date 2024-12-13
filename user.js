// user.js
class User {
    constructor(username, PIN, balance = 0) {
        this.username = username;
        this.PIN = PIN.toString();  // Ensure the PIN is stored as a string
        this.balance = balance;
    }

    authenticate(inputPIN) {
        console.log(`Authenticating with PIN: ${this.PIN} vs ${inputPIN}`);  // Debugging line
        return this.PIN === inputPIN.toString();  // Compare both as strings
    }

    viewBalance() {
        return this.balance;
    }

    deposit(amount) {
        if (amount <= 0) {
            console.log('Amount must be greater than zero.');
            return;
        }
        this.balance += amount;
    }

    withdraw(amount) {
        if (amount <= 0) {
            console.log('Amount must be greater than zero.');
            return;
        }
        if (this.balance >= amount) {
            this.balance -= amount;
        } else {
            console.log('Insufficient balance.');
        }
    }
}

module.exports = User;
