import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Book } from "../models/book.model.js";
import { RateAndReview } from "../models/rateAndReview.model.js";

// Add Rate and Review
const addRateAndReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        return res.statusr(400).json({
            success: false,
            message: "BookId is required.",
            error: null
        });
    }

    const { _id: userId } = req.user;
    if (!userId) {
        return res.statusr(400).json({
            success: false,
            message: "User is not logged in.",
            error: null
        });
    }

    // 
    const { rate, review } = req.body;
    if (!rate && !review) {
        return res.statusr(400).json({
            success: false,
            message: "Rate and review are required.",
            error: null
        });
    }
    if (rate < 1 || rate > 5) {
        return res.statusr(400).json({
            success: false,
            message: "Rate must be between 1 and 5.",
            error: null
        });
    }

    // Check if user has already rated and reviewed the book
    const existingUserRateAndReview = await RateAndReview.findOne({
        userId,
        rateAndReview: { $elemMatch: { bookId } }
    });
    if (existingUserRateAndReview) {
        return res.statusr(400).json({
            success: false,
            message: "You have already rated and reviewed this book.",
            error: null
        });
    }

    // Check if book exists
    const bookData = await Book.findById(bookId);
    if (!bookData) {
        return res.statusr(400).json({
            success: false,
            message: "Book not found.",
            error: null
        });
    }

    // Check if user already rated and reviewed the book
    const existingUser = await RateAndReview.findOne({ userId });
    if (!existingUser) {
        const rateAndReview = await RateAndReview.create({
            userId,
            rateAndReview: [
                {
                    bookId,
                    rate,
                    review
                }
            ]

        });

        return res.status(200).json(new ApiResponse(200, rateAndReview, "Rate and review added successfully."));
    } else {
        existingUser.rateAndReview.push({
            bookId,
            rate,
            review
        })
        await existingUser.save();
        return res.status(200).json(new ApiResponse(200, existingUser, "Rate and review added successfully."));
    }
})

// Get Rate and Review for a Book
const getRateAndReviewForBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        return res.statusr(400).json({
            success: false,
            message: "BookId is required.",
            error: null
        });
    }

    // Find rate and reviews for the given bookId and populate the user details
    const rateAndReview = await RateAndReview.find({
        "rateAndReview.bookId": bookId
    }).populate('userId', 'fullname email');

    // If no reviews are found for the bookId, return an appropriate response
    if (!rateAndReview || rateAndReview.length === 0) {
        return res.status(200).json(new ApiResponse(200, {}, "No rate and review exists for this book."));
    }

    // Filter out reviews for the specific book and include the user data
    const filteredReviews = rateAndReview
        .map(entry =>
            entry.rateAndReview
                .filter(review => review.bookId.toString() === bookId)
                .map(review => ({
                    bookId: review.bookId,
                    rate: review.rate,
                    review: review.review,
                    user: entry.userId // Add the populated user data
                }))
        )
        .flat(); // Flatten the array

    return res.status(200).json(new ApiResponse(200, filteredReviews, "Rate and review fetched successfully."));
});

// Edit Rate and Review
const editRateAndReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        return res.statusr(400).json({
            success: false,
            message: "BookId is required.",
            error: null
        });
    }

    const { _id: userId } = req.user;
    if (!userId) {
        return res.statusr(400).json({
            success: false,
            message: "User is not logged in.",
            error: null
        });
    }

    // Check if user has already rated and reviewed the book
    const existingBookRateAndReview = await RateAndReview.findOne({
        userId,
        "rateAndReview.bookId": bookId
    });
    if (!existingBookRateAndReview) {
        return res.statusr(400).json({
            success: false,
            message: `No rate and review exists for this UserId: ${userId} and BookId: ${bookId}.`,
            error: null
        });
    }

    const { rate, review } = req.body;
    if (!rate && !review) {
        return res.statusr(400).json({
            success: false,
            message: "Rate and review are required.",
            error: null
        });
    }
    if (rate < 1 || rate > 5) {
        return res.statusr(400).json({
            success: false,
            message: "Rate must be between 1 and 5.",
            error: null
        });
    }

    // Use positional operator ($) to update the specific entry in the rateAndReview array
    const updatedBookRateAndReview = await RateAndReview.findOneAndUpdate(
        {
            userId,
            "rateAndReview.bookId": bookId  // Match specific bookId in the rateAndReview array
        },
        {
            $set: {
                "rateAndReview.$.rate": rate,
                "rateAndReview.$.review": review
            }
        },
        {
            new: true
        }
    );

    if (!updatedBookRateAndReview) {
        return res.statusr(400).json({
            success: false,
            message: "Failed to update rate and review.",
            error: null
        });
    }

    return res.status(200).json(new ApiResponse(200, updatedBookRateAndReview, "Rate and review updated successfully."));
});

// Delete Rate and Review
const deleteRateAndReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        return res.statusr(400).json({
            success: false,
            message: "BookId is required.",
            error: null
        });
    }

    const { _id: userId } = req.user;
    if (!userId) {
        return res.statusr(400).json({
            success: false,
            message: "User is not logged in.",
            error: null
        });
    }

    // Check if user has already rated and reviewed the book
    const existingBookRateAndReview = await RateAndReview.findOne({
        userId,
        "rateAndReview.bookId": bookId
    });

    if (!existingBookRateAndReview) {
        return res.statusr(400).json({
            success: false,
            message: `No rate and review exists for this UserId: ${userId} and BookId: ${bookId}.`,
            error: null
        })
    }

    // $pull to remove the specific entry in the rateAndReview array
    const updatedBookRateAndReview = await RateAndReview.findOneAndUpdate(
        {
            userId,
            "rateAndReview.bookId": bookId
        },
        {
            $pull: {
                rateAndReview: { bookId }
            }
        },
        {
            new: true
        }
    );

    if (!updatedBookRateAndReview) {
        return res.statusr(400).json({
            success: false,
            message: "Failed to delete rate and review.",
            error: null
        });
    }

    return res.status(200).json(new ApiResponse(200, updatedBookRateAndReview, "Rate and review deleted successfully."));
});


// Export Controllers
export {
    addRateAndReview,
    getRateAndReviewForBook,
    editRateAndReview,
    deleteRateAndReview
}