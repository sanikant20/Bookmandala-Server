import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\nMongoDB conncted !! \nDB Host: ${connectionInstance.connection.host} \nDB Name: ${DB_NAME}`)
    } catch (error) {
        console.log("Database connection failed", error)
        process.exit(1)
    }
}

export default connectDB