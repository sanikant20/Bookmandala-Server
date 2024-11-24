import { Book } from "../models/book.model.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from 'mongoose';

// Add Books To Cart Controller
const addToCart = asyncHandler(async (req, res) => {
    const { bookId } = req.params;     // Get bookId from req.params
    console.log("bookId", bookId);

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid bookId.",
            error: "Bad request"
        })
    }
    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: "BookId is required.",
            error: "Bad request"
        })
    }

    const { quantity } = req.body;
    console.log("quantity", quantity);
    if (!quantity || quantity < 1) {
        return res.status(400).json({
            success: false,
            message: "Quantity is required and should be greater than 0.",
            error: "Bad request"
        })
    }


    const bookData = await Book.findById(bookId);
    if (!bookData) {
        return res.status(400).json({
            success: false,
            message: "Book not found.",
            error: "Bad request"
        });
    }

    // Check book availability
    if (bookData.quantity < quantity) {
        return res.status(400).json({
            success: false,
            message: `Book is out of stock.
            \nAvailable quantity is ${bookData.quantity} `,
            error: "Bad request"
        });
    }

    // Deduct the quantity from the book stock
    bookData.quantity -= quantity;
    await bookData.save();

    const { _id: userId } = req.user; // Get userId from req.user
    console.log("userId", userId);
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User is not logged in.",
            error: "Bad request"
        })
    }

    // Find or create the cart for the user
    let cartData = await Cart.findOne({ userId });
    if (!cartData) {
        // If no cart exists, create a new cart
        const newCart = await Cart.create({
            userId,
            books: [{ bookId, quantity }],
            total: bookData.price * quantity
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { cart: newCart }, "Book added to cart successfully."));
    } else {
        // Find if the book is already in the cart
        const existingBook = cartData.books.find(book => book.bookId.equals(bookId));
        if (existingBook) {
            // Update quantity and total for the existing book
            existingBook.quantity += quantity;
            cartData.total += bookData.price * quantity;
        } else {
            // If book does not exist in cart, add it
            cartData.books.push({
                bookId: bookId,
                quantity
            });
            cartData.total += bookData.price * quantity;
        }

        // Save the updated cart
        await cartData.save();

        return res
            .status(200)
            .json(new ApiResponse(200, cartData, "Book added/updated in cart successfully."));
    }
});

// Get MyCart Data Controller
const getMyCartData = asyncHandler(async (req, res) => {
    try {
        const { _id: userId } = req.user
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User is not logged in.",
                error: "Bad request"
            })
        }

        const cartData = await Cart.findOne({ userId });
        if (!cartData) {
            return res.status(404).json({
                success: true,
                message: "Cart not found.",
                error: "Not found"
            })
        }

        return res.status(200).json(new ApiResponse(200, cartData, "Cart data fetched successfully."));
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while fetching cart data.",
            error: "Internal server error"
        });
    }
})


// Remove Books From Cart Controller
const removeBookFromCart = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { _id: userId } = req.user;

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid bookId.",
            error: "Bad request"
        })
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found.",
            error: "Not found"
        })
    }

    // Find the index of the book in the cart
    const bookIndex = cart.books.findIndex(book => book.bookId.toString() === bookId);
    if (bookIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Book not found in cart.",
            error: "Not found"
        });
    }

    // Find the associated book in the Book collection
    const book = await Book.findById(bookId);
    if (!book) {
        return res.status(404).json({
            success: false,
            message: "Book not found.",
            error: "Not found"
        });
    }

    // Restore the book's quantity back to stock
    book.quantity += cart.books[bookIndex].quantity;
    await book.save();

    // Update cart total by subtracting the removed book's price * quantity
    cart.total -= book.price * cart.books[bookIndex].quantity;

    // Remove the book from the cart
    cart.books.splice(bookIndex, 1);

    // Save the updated cart
    await cart.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { ExistingBooksInCart: cart },
            `Book with id ${bookId} removed successfully from cart.`));
});


// Export Controllers
export {
    addToCart,
    getMyCartData,
    removeBookFromCart
};
