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

    const existingAdmin = await User.findOne({ role: "ORG_ADMIN", orgId }).lean()
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        error: true,
        errorCode: "FORBIDDEN",
        message: "An admin already exists for this organization",
      })
    }

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
      role: "ORG_ADMIN",
      orgId,
    })
    await user.save()

    return res.status(201).json({
      success: true,
      message: "Organization admin registered successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
    })
  } catch (error) {
    console.error("Org Admin Signup Error:", error)
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

    const user = await User.findOne({ email, role: "ORG_ADMIN" })
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
    console.error("Org Admin Login Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.post("/features", async (req, res) => {
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
    const orgAdmin = await User.findOne({ _id: tokenData.id, role: "ORG_ADMIN" }).lean()
    if (!orgAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    const { key, enabled } = req.body
    if (!key) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Feature flag key is required",
      })
    }

    const existingFlag = await FeatureFlag.findOne({ key, orgId: orgAdmin.orgId }).lean()
    if (existingFlag) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "CONFLICT",
        message: "Feature flag key already exists in this organization",
      })
    }

    const flag = await new FeatureFlag({
      key,
      enabled: enabled === true || enabled === "true",
      orgId: orgAdmin.orgId,
    }).save()

    return res.status(201).json({
      success: true,
      featureFlag: flag,
    })
  } catch (error) {
    console.error("Create Feature Flag Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.get("/features", async (req, res) => {
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
    const orgAdmin = await User.findOne({ _id: tokenData.id, role: "ORG_ADMIN" || "END_USER" }).lean()
    if (!orgAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    let query = { orgId: orgAdmin.orgId }

    let limit = 10
    if (req.query.limit) {
      limit = Number(req.query.limit)
      if (isNaN(limit)) limit = 10
      if (limit >= 100) limit = 100
    }

    let page = 1
    if (req.query.page) {
      page = Number(req.query.page)
      if (!page) page = 1
    }

    let skip = (page - 1) * limit

    let sortBy = "-created"
    if (req.query.sortBy === "date") sortBy = "-created"
    if (req.query.sort == 1) sortBy = sortBy.replace("-", "")

    if (req.query.sname) {
      let sanitizedSname = req.query.sname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim()
      let regex1 = new RegExp(sanitizedSname, "i")
      query.key = { $regex: regex1 }
    }

    let dateQuery = {}
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}/

    if (req.query.sdate) {
      if (isoDatePattern.test(req.query.sdate)) {
        dateQuery["$gte"] = new Date(req.query.sdate)
      } else {
        return res.status(400).json({
          success: false,
          error: true,
          errorCode: "BAD REQUEST",
          message: "Invalid sdate format. Use YYYY-MM-DD",
        })
      }
    }

    if (req.query.edate) {
      if (isoDatePattern.test(req.query.edate)) {
        dateQuery["$lt"] = new Date(req.query.edate)
      } else {
        return res.status(400).json({
          success: false,
          error: true,
          errorCode: "BAD REQUEST",
          message: "Invalid edate format. Use YYYY-MM-DD",
        })
      }
    }

    if (Object.keys(dateQuery).length) query.created = dateQuery

    console.log({ query })

    const flags = await FeatureFlag.find(query).sort(sortBy).skip(skip).limit(limit).lean()
    const count = await FeatureFlag.countDocuments(query)

    return res.status(200).json({
      success: true,
      page,
      count,
      featureFlags: flags,
    })
  } catch (error) {
    console.error("List Feature Flags Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.patch("/features/:id", async (req, res) => {
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
    const orgAdmin = await User.findOne({ _id: tokenData.id, role: "ORG_ADMIN" }).lean()
    if (!orgAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    const flag = await FeatureFlag.findOne({ _id: req.params.id, orgId: orgAdmin.orgId })
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: true,
        errorCode: "NOT FOUND",
        message: "Feature flag not found or access denied",
      })
    }

    const { key, enabled } = req.body

    if (key !== undefined && key !== flag.key) {
      const duplicate = await FeatureFlag.findOne({ key, orgId: orgAdmin.orgId }).lean()
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: true,
          errorCode: "CONFLICT",
          message: "Feature flag key already exists in this organization",
        })
      }
      flag.key = key
    }

    if (enabled !== undefined) {
      flag.enabled = enabled === true || enabled === "true"
    }

    await flag.save()

    return res.status(200).json({
      success: true,
      featureFlag: flag,
    })
  } catch (error) {
    console.error("Update Feature Flag Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.delete("/features/:id", async (req, res) => {
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
    const orgAdmin = await User.findOne({ _id: tokenData.id, role: "ORG_ADMIN" }).lean()
    if (!orgAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    const flag = await FeatureFlag.findByIdAndDelete(req.params.id)
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: true,
        errorCode: "NOT FOUND",
        message: "Feature flag not found or access denied",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Feature flag deleted successfully",
    })
  } catch (error) {
    console.error("Delete Feature Flag Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

module.exports = app
