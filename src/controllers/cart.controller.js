import { Book } from "../models/book.model.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from 'mongoose';

// Add Books To Cart Controller
const addToCart = asyncHandler(async (req, res) => {
    const { bookId } = req.params;     // Get bookId from req.params
    console.log("bookId", bookId);

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        throw new ApiError(400, "Invalid bookId.");
    }
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
    }

    const { quantity } = req.body; // Get quantity from req.body
    console.log("quantity", quantity);
    if (!quantity || quantity < 1) {
        throw new ApiError(400, "Quantity must be greater than 0.");
    }


    const bookData = await Book.findById(bookId);    // Fetch the book details
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.");
    }

    // Check book availability
    if (bookData.quantity < quantity) {
        throw new ApiError(400, `Insufficient book stock.
             \nAvailable quantity is ${bookData.quantity} `);
    }

    // Deduct the quantity from the book stock
    bookData.quantity -= quantity;
    await bookData.save();

    const { _id: userId } = req.user; // Get userId from req.user
    console.log("userId", userId);
    if (!userId) {
        throw new ApiError(400, "User is not logged in.");
    }

    // Find or create the cart for the user
    let cartData = await Cart.findOne({ userId });
    console.log("CartData", cartData);

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
            throw new ApiError(400, "User is not logged in.")
        }

        const cartData = await Cart.findOne({ userId });
        if (!cartData) {
            throw new ApiError(400, "Cart is Empty.")
        }

        return res.status(200).json(new ApiResponse(200, cartData, "Cart data fetched successfully."));
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
})


// Remove Books From Cart Controller
const removeBookFromCart = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { _id: userId } = req.user;

    // Validate bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        throw new ApiError(400, "Invalid bookId.");
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new ApiError(404, 'Cart not found');
    }

    // Find the index of the book in the cart
    const bookIndex = cart.books.findIndex(book => book.bookId.toString() === bookId);

    if (bookIndex === -1) {
        throw new ApiError(404, 'Book not found in cart');
    }

    // Find the associated book in the Book collection
    const book = await Book.findById(bookId);
    if (!book) {
        throw new ApiError(404, 'Book not found in database');
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
