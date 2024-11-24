import { Book } from "../models/book.model.js";
import { Geners } from "../models/geners.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create New Geners Controller
const createGeners = asyncHandler(async (req, res) => {
    // Get BookID
    const { bookId } = req.params;
    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: "BookId is required.",
            error: "Bad request"
        });
    }

    // Find Book with BookID
    const bookData = await Book.findById(bookId);
    if (!bookData) {
        return res.status(404).json({
            success: false,
            message: "Book not found.",
            error: "Not found"
        });
    }

    // Get UserId from req.user
    const { _id: userId } = req.user;
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User is not logged in.",
            error: "Bad request"
        });
    }

    // Get Geners Title from req.body
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required.",
            error: "Bad request"
        });
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
        return res.status(400).json({
            success: false,
            message: "Geners icon file is required.",
            error: "Bad request"
        });
    }

    // Upload Geners Icon to Cloudinary
    const cloudGenersIcon = await uploadOnCloudinary(iconFile);
    if (!cloudGenersIcon) {
        return res.status(400).json({
            success: false,
            message: "Error occurred while uploading Geners icon.",
            error: "Bad request"
        });
    }

    // Create a new Geners
    const newGeners = await Geners.create({
        title: title,
        icon: cloudGenersIcon.url,
        books: [bookData._id],
        owner: userId
    });

    if (!newGeners) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while creating Geners.",
            error: "Internal server error"
        });
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
        return res.status(500).json({
            success: false,
            message: "Error occurred while aggregating Geners with Books and Owner.",
            error: "Internal server error"
        });
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
            return res.status(400).json({
                success: false,
                message: "No geners found.",
                error: "Not found"
            })
        }
        return res.status(200).json(new ApiResponse(200, geners, "Geners fetched successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while fetching geners.",
            error: "Internal server error"
        });
    }
})

// Get Geners by genersId
const getSingleGeners = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        if (!genersId) {
            return res.status(404).json({
                success: false,
                message: "GenersId is required.",
                error: "Bad request"
            })
        }

        const geners = await Geners.findById(genersId)

        if (!geners) {
            return res.status(400).json({
                success: false,
                message: `There is no geners with provided genersId ${genersId}` || "Invalid genersId.",
                error: "Bad request"
            })
        }
        return res.status(200).json(new ApiResponse(200, geners, `Geners successfully fetched with Geners ID: ${genersId}`))

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while fetching geners.",
            error: "Internal server error"
        });
    }
})

// Update Geners Icon
const updateIcon = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        if (!genersId) {
            return res.status(400).json({
                success: false,
                message: "GenersId is required.",
                error: "Bad request"
            })
        }

        const genersData = await Geners.findById(genersId)
        if (!genersData._id) {
            return res.status(404).json({
                success: false,
                message: `There is no geners with provided genersId ${genersId}` || "Invalid genersId.",
                error: "Bad request"
            })
        }

        const iconFile = req.file?.path;
        if (!iconFile) {
            return res.status(400).json({
                success: false,
                message: "Geners icon file is required.",
                error: "Bad request"
            });
        }

        const newCloudIcon = await uploadOnCloudinary(iconFile)
        if (!newCloudIcon) {
            return res.status(500).json({
                success: false,
                message: "Error occurred while uploading Geners icon.",
                error: "Internal server error"
            })
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
            return res.status(400).json({
                success: false,
                message: "Error occurred while updating Geners icon.",
                error: "Internal server error"
            })
        }

        return res.status(200).json(new ApiResponse(200, { updatedGeners }, "Geners icon updated successfully."))
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while updating Geners icon.",
            error: "Internal server error"
        });
    }
});

// Update Geners Title Controller
const updateTitle = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        console.log("genersId", genersId)
        if (!genersId) {
            return res.status(400).json({
                success: false,
                message: "GenersId is required.",
                error: "Bad request"
            })
        }

        const { title } = req.body
        console.log("body", req.body)
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required.",
                error: "Bad request"
            })
        }

        const genersData = await Geners.findById(genersId)
        if (!genersData) {
            return res.status(400).json({
                success: false,
                message: `There is no geners with provided genersId ${genersId}` || "Invalid genersId.",
                error: "Bad request"
            })
        }

        const existingGenersTitle = await Geners.findOne({
            $or: [{ title }],
        });

        if (existingGenersTitle) {
            return res.status(409).json({
                success: false,
                message: "Geners with the same title already exists.",
                error: "Conflict"
            });
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
            return res.status(500).json({
                success: false,
                message: "Error occurred while updating Geners title.",
                error: "Internal server error"
            })
        }

        return res.status(200).json(new ApiResponse(200, geners, "Geners title updated successfully."))

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while updating Geners title.",
            error: "Internal server error"
        });
    }
});

const deleteGeners = asyncHandler(async (req, res) => {
    try {
        const { genersId } = req.params
        console.log("genersId", genersId)
        if (!genersId) {
            return res.status(404).json({
                success: false,
                message: "GenersId is required.",
                error: "Bad request"
            })
        }

        const genersData = await Geners.findById(genersId)
        console.log("genersData", genersData)
        if (!genersData) {
            return res.status(400).json({
                success: false,
                message: `There is no geners with provided genersId ${genersId}` || "Invalid genersId.",
                error: "Bad request"
            })
        }

        const geners = await Geners.findByIdAndDelete(genersId)
        console.log("geners", geners)
        if (!geners) {
            return res.status(500).json({
                success: false,
                message: "Error occurred while deleting Geners.",
                error: "Internal server error"
            })
        }

        return res.status(200).json(new ApiResponse(200, geners, `Geners ${genersData.title} deleted successfully`))

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong while deleting Geners.",
            error: "Internal server error"
        });
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
