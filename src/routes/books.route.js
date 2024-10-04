import { Router } from "express";
import {
    addBooks,
    getAllBooks,
    getBookById,
    deleteBook,
    updateBooksDetails,
    searchBook
} from "../controllers/books.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Use upload.single for single file upload (coverImage)
router.route("/add-book").post(verifyToken, upload.single("coverImage"), addBooks);
router.route("/get-all-books").get(getAllBooks);
router.route("/get-book-by-id/:bookId").get(getBookById)
router.route("/delete-book/:bookId").delete(verifyToken, deleteBook)
router.route("/update-book/:bookId").patch(verifyToken, upload.single("coverImage"), updateBooksDetails)
router.route("/search-book").get(searchBook)

export default router;
