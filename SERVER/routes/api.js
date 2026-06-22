const express = require("express")
const superAdmin = require("./superAdmin")

const app = express.Router()

app.use("/super-admin", superAdmin)

module.exports = app
