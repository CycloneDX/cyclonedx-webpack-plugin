'use strict'

// region esprima
const esprima = require('esprima')
const tokenized = esprima.tokenize('const answer = 42')
console.log('tokenized', tokenized)
// endregion esprima

// region libphonenumber-js
const { parsePhoneNumber } = require('libphonenumber-js')
const phoneNumber = parsePhoneNumber(' 8 (800) 555-35-35 ', 'RU')
console.log('phoneNumber', phoneNumber)
// endregion libphonenumber-js

// region through
const through = require('through')
through(function (data) {
  console.log('through write', data)
})
// endregion through
