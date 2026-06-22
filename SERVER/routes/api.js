const express = require("express")
const superAdmin = require("./superAdmin")
const orgAdmin = require("./orgAdmin")

const app = express.Router()

app.use("/super-admin", superAdmin)
app.use("/org-admin", orgAdmin)

module.exports = app
