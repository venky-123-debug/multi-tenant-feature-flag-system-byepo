// models/FeatureFlag.js

const mongoose = require("mongoose")

const featureFlagSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },

  enabled: {
    type: Boolean,
    default: false,
  },

  orgId: {
    type: String,
    required: true,
  },

  created: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("FeatureFlag", featureFlagSchema)
