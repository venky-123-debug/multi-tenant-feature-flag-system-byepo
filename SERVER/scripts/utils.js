"use strict"

const jwt = require("jsonwebtoken")

module.exports.emailAddressPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*$/i

module.exports.verifyToken = function (token, secret) {
  return new Promise(async (resolve, reject) => {
    try {
      let jwtDecoded = await jwt.verify(token, secret)
      resolve(jwtDecoded)
    } catch (error) {
      console.error(error)
      reject("INVALID ACCESS TOKEN")
    }
  })
}

/**
 * Generate a JWT token with the given data and secret.
 * @param {object} data - The data to be included in the token.
 * @param {string} secret - The secret key used for signing the token.
 * @param {number} [expiresIn] - The expiration time of the token in seconds (default: 120 seconds).
 * @returns {Promise<string>} - A promise that resolves with the generated JWT token or false if an error occurs.
 */
module.exports.generateToken = function (data, secret, expiresIn = 120) {
  return new Promise(async (resolve, reject) => {
    try {
      let jwtSign = await jwt.sign(data, secret, { expiresIn })
      resolve(jwtSign)
    } catch (error) {
      console.error(error)
      reject("FAILED TO GENERATE TOKEN")
    }
  })
}
