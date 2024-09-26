import { Router } from "express";
import {
    getCurrentUser,
    login,
    register,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields(
        [{
            name: 'avatar',
            maxCount: 1
        }]
    ),
    register)

router.route("/login").post(login)

// Secure Route
router.use(verifyToken)
router.route("/get-user").get(getCurrentUser)

export default router