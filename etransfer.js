// etransfer.js
class ETransfer {
    constructor(sender, recipient, amount, securityQuestion, securityAnswer) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.securityQuestion = securityQuestion;
        this.securityAnswer = securityAnswer;
    }

    sendETransfer() {
        return {
            sender: this.sender.username,
            recipient: this.recipient.username,
            amount: this.amount,
            securityQuestion: this.securityQuestion
        };
    }

    acceptETransfer(inputAnswer) {
        return inputAnswer === this.securityAnswer;
    }
}

module.exports = ETransfer;
