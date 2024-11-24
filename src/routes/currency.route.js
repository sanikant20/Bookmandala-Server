import { Router } from "express";
import {
   currency,
   currencyConverter
} from "../controllers/currency.controller.js";
const router = Router();

router.route("/currency").get(currency);
router.route("/currency-converter").get(currencyConverter)

export default router