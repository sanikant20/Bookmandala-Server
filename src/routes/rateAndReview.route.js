import { Router } from "express";
import {
    addRateAndReview,
    getRateAndReviewForBook,
    editRateAndReview,
    deleteRateAndReview
} from "../controllers/rateAndReview.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/add-rate-and-review/:bookId").post(verifyToken, addRateAndReview)
router.route("/get-rate-and-review-for-book/:bookId").get(getRateAndReviewForBook)
router.route("/edit-rate-and-review/:bookId").patch(verifyToken, editRateAndReview)
router.route("/delete-rate-and-review/:bookId").delete(verifyToken, deleteRateAndReview)


export default router