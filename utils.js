// utils.js

// Validate that an input is a non-negative number
function isValidAmount(amount) {
    return !isNaN(amount) && amount >= 0;
}

// Validate that a PIN is a 4-digit number
function isValidPIN(PIN) {
    return /^\d{4}$/.test(PIN);
}

// Validate that a string is not empty or just whitespace
function isValidString(str) {
    return typeof str === 'string' && str.trim().length > 0;
}

// Utility function to handle user input with retries (useful for re-asking input)
async function getValidInput(prompt, validateFunc, errorMsg) {
    let validInput = false;
    let input;

    while (!validInput) {
        input = await prompt();
        if (validateFunc(input)) {
            validInput = true;
        } else {
            console.log(errorMsg);
        }
    }

    return input;
}

module.exports = {
    isValidAmount,
    isValidPIN,
    isValidString,
    getValidInput
};
