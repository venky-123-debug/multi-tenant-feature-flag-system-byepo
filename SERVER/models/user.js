// models/User.js

const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["SUPER_ADMIN", "ORG_ADMIN", "END_USER"],
    required: true,
  },

  orgId: {
    type: String,
    default: null,
  },
  created: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("User", userSchema)
