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
router.use(verifyToken);

router.route("/create-geners").post(upload.single("icon"), createGeners);
router.route("/get-all-geners").get(getAllGeners)
router.route("/get-single-geners/:genersId").get(getSingleGeners)
router.route("/update-icon/:genersId").patch(upload.single("icon"), updateIcon)
router.route("/update-title/:genersId").patch(updateTitle)
router.route("/delete-geners/:genersId").delete(deleteGeners)

export default router;
