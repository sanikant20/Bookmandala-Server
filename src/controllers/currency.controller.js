// import { Book } from "../models/book.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import CC from "currency-converter-lt";
// Mock book data
const bookData = [
    {
        id: 1,
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        year: 1954,
        price: 20,  // Default price in NPR

    },
    {
        id: 2,
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        year: 1937,
        price: 20,  // Default price in NPR

    },
    {
        id: 3,
        title: "The Two Towers",
        author: "J.R.R. Tolkien",
        year: 1954,
        price: 20,  // Default price in NPR

    },
    {
        id: 4,
        title: "The Fellowship of the Ring",
        author: "J.R.R. Tolkien",
        year: 1954,
        price: 20,  // Default price in NPR

    }
];

const currency = asyncHandler(async (req, res,) => {
    // Render the books with NPR as the default currency
    res.render('currencyConverter', { books: bookData, currency: 'NPR' });
})

const currencyConverter = asyncHandler(async (req, res) => {
    const { toCurrency } = req.query;

    const currencyConverter = new CC();
    let updatedBooks = [];

    if (toCurrency === 'USD') {
        // Convert from NPR to USD
        for (let book of bookData) {
            let convertedPrice = await currencyConverter.from('NPR').to('USD').amount(book.price).convert();
            updatedBooks.push({ ...book, price: convertedPrice.toFixed(2) });
        }
    } else if (toCurrency === 'NPR') {
        // Convert from USD to NPR, using the original prices from bookData
        for (let book of bookData) {
            let convertedPrice = await currencyConverter.from('USD').to('NPR').amount(book.price).convert();
            updatedBooks.push({ ...book, price: convertedPrice.toFixed(2) });
        }
    }

    // Render the books with the converted prices
    res.render('currencyConverter', { books: updatedBooks, currency: toCurrency });
})

export {
    currency,
    currencyConverter
}

// app.get('/', (req, res) => {
//     // Render the books with NPR as the default currency
//     res.render('index', { books: bookData, currency: 'NPR' });
// });

// app.get('/convert', async (req, res) => {
//     const { toCurrency } = req.query;

//     const currencyConverter = new CC();
//     let updatedBooks = [];

//     if (toCurrency === 'USD') {
//         // Convert from NPR to USD
//         for (let book of bookData) {
//             let convertedPrice = await currencyConverter.from('NPR').to('USD').amount(book.price).convert();
//             updatedBooks.push({ ...book, price: convertedPrice.toFixed(2) });
//         }
//     } else if (toCurrency === 'NPR') {
//         // Convert from USD to NPR, using the original prices from bookData
//         for (let book of bookData) {
//             let convertedPrice = await currencyConverter.from('USD').to('NPR').amount(book.price).convert();
//             updatedBooks.push({ ...book, price: convertedPrice.toFixed(2) });
//         }
//     }

//     // Render the books with the converted prices
//     res.render('index', { books: updatedBooks, currency: toCurrency });
// });