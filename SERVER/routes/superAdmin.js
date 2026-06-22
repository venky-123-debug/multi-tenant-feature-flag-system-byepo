const express = require("express")
const Org = require("../models/organisation")
const User = require("../models/user")
const SHA256 = require("crypto-js/sha256")
const { generateToken, verifyToken } = require("../scripts/utils")
const app = express.Router()

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

    let user = await User.findOne({ email })
    
    if (user) {
      // Admin is already present. Verify password.
      if (user.password !== SHA256(password).toString()) {
        return res.status(401).json({
          success: false,
          error: true,
          errorCode: "UNAUTHORIZED",
          message: "Invalid credentials",
        })
      }
    } else {
      // User not found. Check if another Super Admin already exists.
      let superAdminCount = await User.find({ role: "SUPER_ADMIN" }).countDocuments()
      if (superAdminCount >= 1) {
        return res.status(403).json({
          success: false,
          error: true,
          errorCode: "FORBIDDEN",
          message: "Super admin already exists with a different email address",
        })
      }

      // No Super Admin exists in the database. Create the first one.
      user = new User({
        email,
        password: SHA256(password).toString(),
        role: "SUPER_ADMIN",
      })
      await user.save()
    }

    const token = await generateToken(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      Number(process.env.JWT_DURATION) || 86400,
    )

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Super Admin Login Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.post("/orgs", async (req, res) => {
  try {
    const token = req.headers["access-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Access token is missing in x-access-token header",
      })
    }

    const tokenData = await verifyToken(token, process.env.JWT_SECRET)
    const superAdmin = await User.findById(tokenData.id, { role: "SUPER_ADMIN" }).lean()
    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }
    const { name } = req.body
    if (!name) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "BAD REQUEST",
        message: "Organization name is required",
      })
    }

    const existingOrg = await Org.findOne({ name })
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: true,
        errorCode: "CONFLICT",
        message: "Organization already exists",
      })
    }

    const org = await new Org({ name }).save()

    return res.status(201).json({
      success: true,
      organization: org,
    })
  } catch (error) {
    console.error("Create Organization Error:", error)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: "An internal server error occurred",
    })
  }
})

app.get("/orgs", async (req, res) => {
  try {
    const token = req.headers["access-token"]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Access token is missing in x-access-token header",
      })
    }

    const tokenData = await verifyToken(token, process.env.JWT_SECRET)
    const superAdmin = await User.findById(tokenData.id, { role: "SUPER_ADMIN" }).lean()
    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        error: true,
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      })
    }

    let query = {}

    let limit = 10

    if (req.query.limit) {
      limit = Number(req.query.limit)
      if (isNaN(limit)) limit = 10
      if (limit >= 100) {
        limit = 100
      }
    }

    let page = 1

    if (req.query.page) {
      page = Number(req.query.page)
      if (!page) page = 1
    }

    let skip = (page - 1) * limit

    let sortBy = "-created"

    if (req.query.sortBy == "date") sortBy = "-created"

    if (req.query.sort == 1) sortBy = sortBy.replace("-", "")
    if (req.query.sname) {
      let sanitizedSname = req.query.sname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim()

      let regex1 = new RegExp(sanitizedSname, "i")

      query.name = { $regex: regex1 }
    }

    let dateQuery = {}

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}/

    if (req.query.sdate) {
      if (isoDatePattern.test(req.query.sdate)) {
        dateQuery["$gte"] = new Date(req.query.sdate)
      } else {
        throw "INVALID_DATE"
      }
    }

    if (req.query.edate) {
      if (isoDatePattern.test(req.query.edate)) {
        dateQuery["$lt"] = new Date(req.query.edate)
      } else {
        throw "INVALID_DATE"
      }
    }

    if (Object.keys(dateQuery).length) query.created = dateQuery

    console.log({ query })

    const orgs = await Org.find(query).sort(sortBy).skip(skip).limit(limit).lean()
    let count = await Org.countDocuments(query)
    return res.status(200).json({
      success: true,
      page,
      count,
      organizations: orgs,
    })
  } catch (error) {
    console.error("List Organizations Error:", error)

    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "SERVER ERROR",
      message: typeof error === "string" ? error : "An internal server error occurred",
    })
  }
})

module.exports = app
