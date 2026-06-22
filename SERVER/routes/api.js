const express = require("express")
const superAdmin = require("./superAdmin")
const orgAdmin = require("./orgAdmin")
const user = require("./user")

const app = express.Router()

app.use("/super-admin", superAdmin)
app.use("/org-admin", orgAdmin)
app.use("/user", user)

module.exports = app
