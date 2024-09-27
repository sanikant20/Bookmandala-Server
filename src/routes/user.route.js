import { Router } from "express";
import {
    changePassword,
    editUserData,
    getCurrentUser,
    login,
    logout,
    register,
    updateAvatar,
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
router.route("/logout").post(verifyToken, logout)
router.route("/get-user").get(verifyToken, getCurrentUser)
router.route("/edit-user-data").patch(verifyToken, editUserData)
router.route("/update-avatar").patch(verifyToken, upload.single("avatar"), updateAvatar)
router.route("/change-password").patch(verifyToken, changePassword)

export default router