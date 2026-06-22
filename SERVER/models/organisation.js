// models/Organization.js

const mongoose = require("mongoose")

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Organization", organizationSchema)
