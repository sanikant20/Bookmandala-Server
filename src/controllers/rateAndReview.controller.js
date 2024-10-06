import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Book } from "../models/book.model.js";
import { RateAndReview } from "../models/rateAndReview.model.js";

// Add Rate and Review
const addRateAndReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
    }

    const { _id: userId } = req.user;
    if (!userId) {
        throw new ApiError(400, "User is not logged in.");
    }

    // 
    const { rate, review } = req.body;
    if (!rate && !review) {
        throw new ApiError(400, "Rate and review are required.");
    }
    if (rate < 1 || rate > 5) {
        throw new ApiError(400, "Rate must be between 1 and 5.");
    }

    // Check if user has already rated and reviewed the book
    const existingUserRateAndReview = await RateAndReview.findOne({
        userId,
        rateAndReview: { $elemMatch: { bookId } }
    });
    if (existingUserRateAndReview) {
        throw new ApiError(400, "You have already rated and reviewed this book.");
    }

    // Check if book exists
    const bookData = await Book.findById(bookId);
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.");
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

    // Ensure bookId is provided
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
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
        throw new ApiError(400, "BookId is required.");
    }

    const { _id: userId } = req.user;
    if (!userId) {
        throw new ApiError(400, "User is not logged in.");
    }

    // Check if user has already rated and reviewed the book
    const existingBookRateAndReview = await RateAndReview.findOne({
        userId,
        "rateAndReview.bookId": bookId
    });
    if (!existingBookRateAndReview) {
        throw new ApiError(400, "No rate and review exists for this book.");
    }

    const { rate, review } = req.body;
    if (!rate && !review) {
        throw new ApiError(400, "Rate and review are required.");
    }
    if (rate < 1 || rate > 5) {
        throw new ApiError(400, "Rate must be between 1 and 5.");
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
        throw new ApiError(400, "Failed to update rate and review.");
    }

    return res.status(200).json(new ApiResponse(200, updatedBookRateAndReview, "Rate and review updated successfully."));
});

// Delete Rate and Review
const deleteRateAndReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
    }

    const { _id: userId } = req.user;
    if (!userId) {
        throw new ApiError(400, "User is not logged in.");
    }

    // Check if user has already rated and reviewed the book
    const existingBookRateAndReview = await RateAndReview.findOne({
        userId,
        "rateAndReview.bookId": bookId
    });

    if (!existingBookRateAndReview) {
        throw new ApiError(400,
            `No rate and review exists for this UserId: ${userId} and BookId: ${bookId}.`
        );
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
            } // Remove the entry with the matching bookId
        },
        {
            new: true // Return the updated document
        }
    );

    if (!updatedBookRateAndReview) {
        throw new ApiError(400, "Failed to delete rate and review.");
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