import { Router } from "express";
import { checkServer } from "../controllers/checkServer.controller.js";
const router = Router()

router.route("/").get(checkServer)

export default router