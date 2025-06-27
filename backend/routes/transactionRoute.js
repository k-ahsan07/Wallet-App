import express from "express"
import { sql } from "../config/db";
import {
    getTransactions,
    createTransaction,
    deleteTransaction,
    getTransactionSummary
} from "../controller/transactionController.js";

const router = express.Router()

router.get("/:userId", getTransactions);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);
router.get("/summary/:userId", getTransactionSummary);

export default router;
