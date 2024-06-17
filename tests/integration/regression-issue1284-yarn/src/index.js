const { parsePhoneNumberFromString } = require("libphonenumber-js/max");
const { DateTime } = require("luxon");

console.log(DateTime.now());

console.log(parsePhoneNumberFromString("+12133734253", "US"));
