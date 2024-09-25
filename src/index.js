import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import {app} from "./app.js"
dotenv.config({
    path: './.env'
})


// Database connection is called here
connectDB()
    .then(() => {
        //Throw error while there is an error
        app.on("error", (error) => {
            console.log("Error : ", error)
            throw error
        })

        // Listen port for server
        app.listen(`${process.env.PORT || 8000}`, () => {
            console.log(`Server is running at PORT : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log(`MongoDB connection failed !!!`, err)
    })