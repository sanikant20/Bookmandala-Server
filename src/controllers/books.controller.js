import { Book } from "../models/book.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Add Books Controller
const addBooks = asyncHandler(async (req, res) => {
    // Get UserId from req.user
    const { _id: userId } = req.user
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User is not logged in.",
            error: "Bad request"
        })
    }

    // Get Book data from req.body
    const {
        title, author, price, quantity,
        descriptionTitle, description,
        pageCount, weight, ISBN, language
    } = req.body;

    // Fix for checking empty fields in body
    if ([title, author, price, quantity].some(field => !field || field.trim() === "")) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
            error: "Bad request"
        })
    }

    // Check if same geners already have same book
    const existingBook = await Book.findOne({
        $and: [
            { title: title },
            { author: author },
        ]
    });
    if (existingBook) {
        return res.status(400).json({
            success: false,
            message: `This book already existed with \n Title: ${title}\n and \n Author: ${author}.`,
            error: "Bad request"
        })
    }

    // Upload Cover Image
    const coverImageLocalFilePath = req.file?.path;
    if (!coverImageLocalFilePath) {
        return res.status(400).json({
            success: false,
            message: "Cover image is required.",
            error: "Bad request"
        })
    }

    // Upload Cover Image to Cloudinary
    const cloudBookCoverImage = await uploadOnCloudinary(coverImageLocalFilePath);
    if (!cloudBookCoverImage) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while uploading cover image.",
            error: "Bad request"
        });
    }

    // Create the book record in the database
    const books = await Book.create({
        title,
        author,
        price,
        quantity,
        coverImage: cloudBookCoverImage.url,
        descriptionTitle,
        description,
        pageCount,
        weight,
        ISBN,
        language,
        owner: userId
    });
    if (!books) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding books.",
            error: "Internal server error"
        })
    }

    // Perform aggregation to get book with owner
    const bookWithOwner = await Book.aggregate([
        {
            $match: {
                _id: books._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                title: 1,
                author: 1,
                price: 1,
                quantity: 1,
                coverImage: 1,
                descriptionTitle: 1,
                description: 1,
                pageCount: 1,
                weight: 1,
                ISBN: 1,
                language: 1,
                owner: 1
            }
        }
    ]);
    if (!bookWithOwner?.length) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding books with owner data.",
            error: "Internal server error"
        });
    }

    // Return the response
    return res
        .status(200)
        .json(new ApiResponse(200, { books: bookWithOwner[0] }, "Books added successfully."));
});

// Get All Books Controller
const getAllBooks = asyncHandler(async (req, res) => {
    const books = await Book.find();
    if (books?.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No books found.",
            error: "Bad request"
        })
    }

    return res.status(200).json(new ApiResponse(200, books, "Books fetched successfully."));
})

// Get Book by ID Controller
const getBookById = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: "BookId is required.",
            error: "Bad request"
        })
    }

    const bookData = await Book.findById(bookId)
    if (!bookData) {
        return res.status(400).json({
            success: false,
            message: "Book not found.",
            error: "Bad request"
        })
    }

    return res.status(200).json(new ApiResponse(200, bookData, "Book fetched successfully."));
})

// Delete Book Controller
const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: "BookId is required.",
            error: "Bad request"
        })
    }
    const bookData = await Book.findById(bookId)
    if (!bookData) {
        return res.status(400).json({
            success: false,
            message: "Book not found.",
            error: "Bad request"
        })
    }
    const deletedBook = await Book.findByIdAndDelete(bookId)
    if (!deletedBook) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting book.",
            error: "Internal server error"
        })
    }
    return res.status(200).json(new ApiResponse(200, deletedBook, "Book deleted successfully."));
})

// Update Book Details Controller
const updateBooksDetails = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        return res.status(400);
    }

    const bookData = await Book.findById(bookId);
    if (!bookData) {
        return res.status(400).json({
            success: false,
            message: "Book not found.",
            error: "Bad request"
        })
    }

    // Destructure book details from req.body
    const {
        title, author, price, quantity,
        descriptionTitle, description,
        pageCount, weight, ISBN, language
    } = req.body;

    let updateFields = {
        title,
        author,
        price,
        quantity,
        descriptionTitle,
        description,
        pageCount,
        weight,
        ISBN,
        language,
    };

    // Check if a new cover image was uploaded
    if (req.file) {
        const coverImageLocalFilePath = req.file.path;

        // Upload the cover image to Cloudinary
        const cloudBookCoverImage = await uploadOnCloudinary(coverImageLocalFilePath);
        if (!cloudBookCoverImage) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while uploading cover image.",
                error: "Bad request"
            });
        }

        // Add the uploaded cover image URL to the update fields
        updateFields.coverImage = cloudBookCoverImage.url;
    }

    // Update the book details in the database
    const updatedBook = await Book.findByIdAndUpdate(bookId,
        updateFields,
        {
            new: true,
        }
    );

    if (!updatedBook) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating book details.",
            error: "Internal server error"
        });
    }

    // Return the updated book data
    return res.status(200).json(new ApiResponse(200, updatedBook, "Book details updated successfully."));
});

// Search Book Controller
const searchBook = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Enter book name or price or author.",
            error: "Bad request"
        })
    }

    const searchQuery = query.trim();
    const bookData = await Book.find({
        $or: [
            { title: { $regex: query, $options: "i" } },
            { author: { $regex: query, $options: "i" } },
            { price: isNaN(searchQuery) ? undefined : Number(searchQuery) }
        ]
    })

    if (!bookData.length) {
        return res.status(200).json({
            success: false,
            message: "No books found.",
            error: "Bad request"
        })
    }
    return res.status(200).json(new ApiResponse(200, bookData, "Books fetched successfully."));
})

// Export Controllers
export {
    addBooks,
    getAllBooks,
    getBookById,
    deleteBook,
    updateBooksDetails,
    searchBook
};
