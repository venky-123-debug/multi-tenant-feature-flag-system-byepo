const express = require("express")
const Org = require("../models/organisation")
const User = require("../models/user")
const FeatureFlag = require("../models/feature")
const SHA256 = require("crypto-js/sha256")
const { generateToken, verifyToken } = require("../scripts/utils")
const app = express.Router()

app.post("/signup", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Request body is required",
      })
    }

    const { email, password, orgName } = req.body

    if (!email || !password || !orgName) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Email, password, and orgName are required",
      })
    }

    const org = await Org.findOne({ name: orgName }).lean()
    if (!org) {
      return res.status(404).json({
        success: false,
        error: true,
        errorCode: "NOT FOUND",
        message: "Organization not found",
      })
    }

    const orgId = org._id.toString()

    const existingUser = await User.findOne({ email }).lean()
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "CONFLICT",
        message: "Email already in use",
      })
    }

    const user = new User({
      email,
      password: SHA256(password).toString(),
      role: "END_USER",
      orgId,
    })
    await user.save()

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
    })
  } catch (error) {
    console.error("User Signup Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.post("/login", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Request body is required",
      })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Email and password are required",
      })
    }

    const user = await User.findOne({ email, role: "END_USER" })
    if (!user || user.password !== SHA256(password).toString()) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid email or password",
      })
    }

    const org = await Org.findById(user.orgId).lean()
    const orgName = org ? org.name : ""

    const token = await generateToken(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        orgName,
      },
      process.env.JWT_SECRET,
      Number(process.env.JWT_DURATION) || 86400,
    )

    return res.status(200).json({
      success: true,
      token,
    })
  } catch (error) {
    console.error("User Login Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.post("/toggle-feature", async (req, res) => {
  try {
    const token = req.headers["access-token"]
    if (!token) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Access token is missing in access-token header",
      })
    }

    const tokenData = await verifyToken(token, process.env.JWT_SECRET)
    const user = await User.findOne({ _id: tokenData.id, role: "END_USER" }).lean()
    if (!user) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    const { featureKey, orgName } = req.body
    if (!featureKey || !orgName) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "featureKey and orgName are required in request body",
      })
    }

    const org = await Org.findOne({ name: orgName }).lean()
    if (!org) {
      return res.status(404).json({
        success: false,
        error: true,
        errorCode: "NOT FOUND",
        message: "Organization not found",
      })
    }

    const orgId = org._id.toString()

    if (user.orgId !== orgId) {
      return res.status(403).json({
        success: false,
        error: true,
        errorCode: "FORBIDDEN",
        message: "Access denied. User do not belong to this organization.",
      })
    }

    const flag = await FeatureFlag.findOne({ key: featureKey, orgId })
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: true,
        errorCode: "NOT FOUND",
        message: "Feature flag not found for this organization",
      })
    }

    flag.enabled = !flag.enabled
    await flag.save()

    return res.status(200).json({
      success: true,
      message: "Feature flag toggled successfully",
      featureFlag: flag,
    })
  } catch (error) {
    console.error("Toggle Feature Flag Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

module.exports = app
