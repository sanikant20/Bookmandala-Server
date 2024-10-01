import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

// Configuration
const app = express();

// cross origin resource sharing configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Main configuration
app.use(express.json({ limit: "16kb" })); // It's limit the json file size
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // URL encoded extended i.e., sanikant+kushwaha+423ffoijf, sanikant%kushwaha%lksjf893
app.use(express.static("public")); // public assets store files like images,videos, etc.
app.use(cookieParser());


// Session configuration
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.EXPRESS_SESSION_SECRET_KEY
}));

// View engine configuration
app.set('view engine', 'ejs');

// Routes import
import checkServerRoutes from "./routes/checkServer.route.js";
import userRoutes from "./routes/user.route.js";
import genersRoutes from "./routes/geners.route.js";
import googleAuthRoute from "./routes/googleAuth.route.js";

// Route declearation
app.use("/api/v1/check-server", checkServerRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/geners", genersRoutes);
app.use('/', googleAuthRoute); // Google Auth {http://localhost:8000/auth/google}



export { app };
