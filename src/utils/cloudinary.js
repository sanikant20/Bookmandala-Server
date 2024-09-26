import { v2 as cloudinary } from "cloudinary";
import { error } from "console";
import fs from "fs"

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
    secure: true
});

// Function to upload files on Cloudinary
const uploadOnCloudinary = async (locaFilePath) => {
    try {
        if (!locaFilePath) return null

        const uploadResult = await cloudinary.uploader.upload(locaFilePath,
            {
                resource_type: "auto",
                folder: "bookMandala"
            }
        )
        if (!uploadResult) {
            throw new Error(400, "Failed to upload file" || error.message)
        }
        console.log("File seccessfully uploaded on Cloudinary:", uploadResult.url)

        // Delete file from local path when successfully upload on cloudinary
        fs.unlinkSync(locaFilePath)
        return uploadResult

    } catch (error) {
        fs.unlinkSync(locaFilePath)
        return null
    }
}

export { uploadOnCloudinary }






