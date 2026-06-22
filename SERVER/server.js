const morgan = require("morgan")
const express = require("express")
const mongoose = require("mongoose")

require("dotenv").config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(async (err, req, res, next) => {
  if (err instanceof SyntaxError && err.type == "entity.too.large") {
    console.error(err)
    return res.status(413).json({
      success: false,
      error: true,
      errorCode: "CONTENT TOO LARGE",
    })
  }

  if (err instanceof SyntaxError && err.type == "entity.parse.failed") {
    console.error(err)
    return res.send({
      success: false,
      error: true,
      errorCode: "INVALID JSON STRUCTURE",
    })
  }

  if (err) {
    console.error(err)
    return res.status(500).json({
      success: false,
      error: true,
      errorCode: "CONTACT SUPPORT",
    })
  }

  next()
})

app.set("etag", false)
app.enable("trust proxy")

app.use(morgan(process.env.MORGAN_LOG || "dev"))

const routes = require("./routes/api")
app.use("/", routes)

async function startup() {
  await mongoose.connect(process.env.MONGODB_CONNECTION)
  try {
    app.listen(process.env.PORT, () => {
      console.log(`SERVER STARTED ON : ${process.env.PORT}`)
    })
  } catch (error) {
    console.error(error)
  }
}

startup()
