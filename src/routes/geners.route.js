import { Router } from "express";
import {
    createGeners,
    getAllGeners,
    getSingleGeners,
    updateIcon,
    updateTitle,
    deleteGeners,
} from "../controllers/geners.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-geners/:bookId").post(verifyToken, upload.single("icon"), createGeners);
router.route("/get-all-geners").get(getAllGeners)
router.route("/get-single-geners/:genersId").get(getSingleGeners)
router.route("/update-icon/:genersId").patch(verifyToken, upload.single("icon"), updateIcon)
router.route("/update-title/:genersId").patch(verifyToken, updateTitle)
router.route("/delete-geners/:genersId").delete(verifyToken, deleteGeners)

export default router;
