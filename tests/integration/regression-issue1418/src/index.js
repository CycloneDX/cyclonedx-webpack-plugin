'use strict'

// region libphonenumber-js
const { parsePhoneNumber } = require('libphonenumber-js')
const phoneNumber = parsePhoneNumber(' 8 (800) 555-35-35 ', 'RU')
console.log('phoneNumber', phoneNumber)
// endregion libphonenumber-js
