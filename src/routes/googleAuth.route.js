import { Router } from "express";
import passport from "passport";
import "../utils/google.js";
import {
    loadAuth,
    successGoogleLogin,
    failureGoogleLogin,
    logout
} from "../controllers/googleAuth.controller.js";

const router = Router();

// Passport Configuration
router.use(passport.initialize());
router.use(passport.session());

// Auth Routes
router.route("/auth/google").get(passport.authenticate('google',
    {
        scope: ['email', 'profile']
    }
));
router.route("/auth/google/callback").get(passport.authenticate('google',
    {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    }
));
router.route("/").post(loadAuth);
router.route("/auth/google/success").post(successGoogleLogin);
router.route("/auth/google/failure").post(failureGoogleLogin);
router.route("/auth/google/logout").post(logout)


export default router