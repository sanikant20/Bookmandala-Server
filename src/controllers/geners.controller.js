import { Book } from "../models/book.model.js";
import { Geners } from "../models/geners.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create New Geners Controller
const createGeners = asyncHandler(async (req, res) => {
    // Get BookID
    const { bookId } = req.params;
    if (!bookId) {
        throw new ApiError(400, "BookId is required.");
    }

    // Find Book with BookID
    const bookData = await Book.findById(bookId);
    if (!bookData) {
        throw new ApiError(400, "Invalid bookId.");
    }

    // Get UserId from req.user
    const { _id: userId } = req.user;
    if (!userId) {
        throw new ApiError(400, "User is not logged in.");
    }

    // Get Geners Title from req.body
    const { title } = req.body;
    if (!title) {
        throw new ApiError(400, "Title is required.");
    }

    // Check if Geners with the same title already exists
    const existingGenersWithSameTitle = await Geners.findOne({
        title: title,
    });

    // If genre with the same title exists, add the book to that genre
    if (existingGenersWithSameTitle) {
        // Check if the book is already in the genre
        if (!existingGenersWithSameTitle.books.includes(bookId)) {
            existingGenersWithSameTitle.books.unshift(bookId);
            await existingGenersWithSameTitle.save();
        }

        return res.status(200).json(new ApiResponse(
            200,
            existingGenersWithSameTitle,
            "Genre with the same title already exists. Book added to the genre."
        ));
    }

    // Upload Geners Icon
    const iconFile = req.file?.path;
    if (!iconFile) {
        throw new ApiError(400, "Icon file is required.");
    }

    // Upload Geners Icon to Cloudinary
    const cloudGenersIcon = await uploadOnCloudinary(iconFile);
    if (!cloudGenersIcon) {
        throw new ApiError(400, "Failed to upload genre icon to cloud.");
    }

    // Create a new Geners
    const newGeners = await Geners.create({
        title: title,
        icon: cloudGenersIcon.url,
        books: [bookData._id], 
        owner: userId
    });

    if (!newGeners) {
        throw new ApiError(500, "Error occurred while creating genre.");
    }

    // Aggregate Geners with Books and Owner
    const genersWithBooks = await Geners.aggregate([
        {
            $match: { _id: newGeners._id }
        },
        {
            $lookup: {
                from: "books",
                localField: "books",
                foreignField: "_id",
                as: "books"
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
            $project: {
                title: 1,
                icon: 1,
                books: 1,
                owner: 1
            }
        }
    ]);

    if (!genersWithBooks || genersWithBooks.length === 0) {
        throw new ApiError(500, "Error occurred while fetching genres with books.");
    }

    // Send response
    return res.status(200).json(new ApiResponse(
        200,
        { geners: genersWithBooks[0] },
        "Genre created successfully."
    ));
});

// Get Geners Controller
const getAllGeners = asyncHandler(async (req, res) => {
    try {
        const geners = await Geners.find()
        if (!geners || !geners.length === 0) {
            throw new ApiError(400, "There is no geners.")
        }
        return res.status(200).json(new ApiResponse(200, geners, "Geners fetched successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
})

// Get Geners by genersId
const getSingleGeners = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        if (!genersId) {
            throw new ApiError(404, "Invalid genersId")
        }

        const geners = await Geners.findById(genersId)

        if (!geners) {
            throw new ApiError(400, `There is no geners with provided genersId ${genersId}`)
        }
        return res.status(200).json(new ApiResponse(200, geners, `Geners successfully fetched with Geners ID: ${genersId}`))

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
})

// Update Geners Icon
const updateIcon = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        if (!genersId) {
            throw new ApiError(400, "genersId is required")
        }

        const genersData = await Geners.findById(genersId)
        if (!genersData._id) {
            throw new ApiError(404, "Invalid genersId")
        }

        const iconFile = req.file?.path;
        if (!iconFile) {
            throw new ApiError(400, "Geners icon file is required for update. ");
        }

        const newCloudIcon = await uploadOnCloudinary(iconFile)
        if (!newCloudIcon) {
            throw new ApiError(500, "Something went wrong while uploading new icon for update.")
        }

        const updatedGeners = await Geners.findByIdAndUpdate(genersData._id,
            {
                $set: {
                    icon: newCloudIcon.url
                }
            },
            {
                new: true,
            }
        );
        if (!updatedGeners) {
            throw new ApiError(400, "failed to update icon")
        }

        return res.status(200).json(new ApiResponse(200, { updatedGeners }, "Geners icon updated successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
});

// Update Geners Title Controller
const updateTitle = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        console.log("genersId", genersId)
        if (!genersId) {
            throw new ApiError(400, "GenersId is required.")
        }

        const { title } = req.body
        console.log("body", req.body)
        if (!title) {
            throw new ApiError(400, "Title is required.")
        }

        const genersData = await Geners.findById(genersId)
        if (!genersData) {
            throw new ApiError(400, "Invalid genersId.")
        }

        const existingGenersTitle = await Geners.findOne({
            $or: [{ title }],
        });

        if (existingGenersTitle) {
            throw new ApiError(409, "Geners title already exists.");
        }

        const geners = await Geners.findByIdAndUpdate(genersId,
            {
                $set: {
                    title: title
                }
            },
            {
                new: true
            }
        )
        if (!geners) {
            throw new ApiError(500, "Something went wrong while updating geners title.")
        }

        return res.status(200).json(new ApiResponse(200, geners, "Geners title updated successfully."))

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
});

const deleteGeners = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        console.log("genersId", genersId)
        if (!genersId) {
            throw new ApiError(404, "GenersId is required.")
        }

        const genersData = await Geners.findById(genersId)
        console.log("genersData", genersData)
        if (!genersData) {
            throw new ApiError(400, "Invalid genersId.")
        }

        const geners = await Geners.findByIdAndDelete(genersId)
        console.log("geners", geners)
        if (!geners) {
            throw new ApiError(500, "Something went wrong while deleting geners.")
        }

        return res.status(200).json(new ApiResponse(200, geners, `Geners ${genersData.title} deleted successfully`))

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(500, error.message));
    }
});

export {
    createGeners,
    getAllGeners,
    getSingleGeners,
    updateIcon,
    updateTitle,
    deleteGeners
};
