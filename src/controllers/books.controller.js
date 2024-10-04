import { Book } from "../models/book.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Add Books Controller
const addBooks = asyncHandler(async (req, res) => {
    // Get UserId from req.user
    const { _id: userId } = req.user
    if (!userId) {
        throw new ApiError(400, "User is not logged in.")
    }

    // Get Book data from req.body
    const {
        title, author, price, quantity,
        descriptionTitle, description,
        pageCount, weight, ISBN, language
    } = req.body;

    // Fix for checking empty fields in body
    if ([title, author, price, quantity].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    // Check if same geners already have same book
    const existingBook = await Book.findOne({
        $and: [
            { title: title },
            { author: author },
        ]
    });
    if (existingBook) {
        throw new ApiError(400, `This book already existed with \n Title: ${title}\n and \n Author: ${author}.`);
    }

    // Upload Cover Image
    const coverImageLocalFilePath = req.file?.path;
    if (!coverImageLocalFilePath) {
        throw new ApiError(400, "Cover image is missing");
    }

    // Upload Cover Image to Cloudinary
    const cloudBookCoverImage = await uploadOnCloudinary(coverImageLocalFilePath);
    if (!cloudBookCoverImage) {
        throw new ApiError(400, "Failed to upload book cover image on cloud.");
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
        throw new ApiError(500, "Something went wrong while adding books.");
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
        throw new ApiError(500, "Something went wrong while adding books with geners.");
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
        throw new ApiError(400, "No books found.");
    }

    return res.status(200).json(new ApiResponse(200, books, "Books fetched successfully."));
})

// Get Book by ID Controller
const getBookById = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!bookId) {
        throw new ApiError(400, "BookId is required.")
    }

    const bookData = await Book.findById(bookId)
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.")
    }

    return res.status(200).json(new ApiResponse(200, bookData, "Book fetched successfully."));
})

// Delete Book Controller
const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!bookId) {
        throw new ApiError(400, "BookId is required.")
    }
    const bookData = await Book.findById(bookId)
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.")
    }
    const deletedBook = await Book.findByIdAndDelete(bookId)
    if (!deletedBook) {
        throw new ApiError(500, "Something went wrong while deleting book.")
    }
    return res.status(200).json(new ApiResponse(200, deletedBook, "Book deleted successfully."));
})

// Update Book Details Controller
const updateBooksDetails = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
    }

    const bookData = await Book.findById(bookId);
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.");
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
            throw new ApiError(400, "Failed to upload book cover image on cloud.");
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
        throw new ApiError(500, "Something went wrong while updating book details.");
    }

    // Return the updated book data
    return res.status(200).json(new ApiResponse(200, updatedBook, "Book details updated successfully."));
});

// Search Book Controller
const searchBook = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query) {
        throw new ApiError(400, "Query is required.")
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
        return res.status(200).json(new ApiResponse(200, {}, `No result for ${query}.`))
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
