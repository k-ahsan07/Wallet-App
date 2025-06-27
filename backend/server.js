import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

const app = express();

dotenv.config();

app.use(express.json());
app.use((req, res, next) => {
    console.log("Hey req is hit, the method is", req.method);
    next();
});

const PORT = process.env.PORT || 5001;

app.get("/",(req,res)=>{
    res.send("Its working")
})

app.get("/api/transactions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await sql`
            SELECT * FROM transaction WHERE user_id = ${userId}
        `;
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error getting transactions:", error.stack || error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

app.post("/api/transactions", async (req, res) => {
    // for title, amount, category, user_id
    try {
        console.log("Request body:", req.body);
        const { title, amount, category, user_id } = req.body;
        if (!title || !user_id || !category || amount === undefined) {
            return res.status(400).json({ message: "All fields required" });
        }
        const transaction = await sql`
            INSERT INTO transaction(user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `;
        res.status(201).json(transaction[0]);
    } catch (error) {
        console.error("Error creating transaction:", error.stack || error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Delete a transaction by its id
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql`
            DELETE FROM transaction WHERE id = ${id} RETURNING *
        `;
        if (result.length === 0) {
            return res.status(404).json({ message: `Transaction with id ${id} not found` });
        }
        res.status(200).json({ message: `Transaction deleted with id: ${id}`, transaction: result[0] });
    } catch (error) {
        console.error("Error deleting transaction:", error.stack || error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Get summary of transactions for a user
app.get("/api/transactions/summary/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        // Total number of transactions and total amount
        const summary = await sql`
            SELECT COUNT(*) AS total_transactions, COALESCE(SUM(amount),0) AS total_amount
            FROM transaction WHERE user_id = ${userId}
        `;
        // Total amount per category
        const perCategory = await sql`
            SELECT category, COALESCE(SUM(amount),0) AS total_amount
            FROM transaction WHERE user_id = ${userId}
            GROUP BY category
        `;
        // Define income and expense categories
        const incomeCategories = ['income', 'salary', 'deposit', 'bonus', 'refund', 'interest'];
        const expenseCategories = ['expense', 'bill', 'bills', 'shopping', 'food', 'rent', 'utilities', 'entertainment', 'travel', 'health', 'education', 'other'];
        // Calculate income
        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS income
            FROM transaction WHERE user_id = ${userId} AND LOWER(category) = ANY(${incomeCategories})
        `;
        // Calculate expense (all that are not income categories)
        const expenseResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS expense
            FROM transaction WHERE user_id = ${userId} AND LOWER(category) <> ALL(${incomeCategories})
        `;
        const income = Number(incomeResult[0].income);
        const expense = Number(expenseResult[0].expense);
        const balance = income - expense;
        res.status(200).json({
            total_transactions: Number(summary[0].total_transactions),
            total_amount: Number(summary[0].total_amount),
            balance,
            income,
            expense,
            per_category: perCategory
        });
    } catch (error) {
        console.error("Error getting summary:", error.stack || error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

async function initDB() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS transaction (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount NUMERIC(10,0) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'PKR' CHECK (currency = 'PKR'),
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;
        console.log("Database initialized successfully");
    } catch (error) {
        console.log("Error :", error);
        process.exit(1);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is up and working on Port:", PORT);
    });
});