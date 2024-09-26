import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// cross origin resource sharing configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Main configuration
app.use(express.json({ limit: "16kb" })) // It's limit the json file size
app.use(express.urlencoded({ extended: true, limit: "16kb" })) // URL encoded extended i.e., sanikant+kushwaha+423ffoijf, sanikant%kushwaha%lksjf893
app.use(express.static("public")) // public assets store files like images,videos, etc.
app.use(cookieParser())


// Routes import
import userRoutes from "./routes/user.route.js"

// Route declearation
app.use("/api/v1/users", userRoutes)

export { app }