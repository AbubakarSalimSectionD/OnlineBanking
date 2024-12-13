// app.js
const BankingApp = require('./bankingApp');

(async function() {
    const app = new BankingApp();
    const user = await app.authenticateUser();
    await app.mainMenu(user);
})();
