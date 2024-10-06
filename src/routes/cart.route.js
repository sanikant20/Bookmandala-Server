import { Router } from "express";
import {
    addToCart,
    getMyCartData,
    removeBookFromCart
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/add-to-cart/:bookId").post(verifyToken, addToCart)
router.route("/get-myCart-data").get(verifyToken, getMyCartData)
router.route("/remove-book-from-cart/:bookId").delete(verifyToken, removeBookFromCart)

export default router