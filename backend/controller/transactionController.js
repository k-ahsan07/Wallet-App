import { sql } from "../config/db";

// Get all transactions for a user
export const getTransactions = async (req, res) => {
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
};

// Create a new transaction
export const createTransaction = async (req, res) => {
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
};

// Delete a transaction by its id
export const deleteTransaction = async (req, res) => {
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
};

// Get summary of transactions for a user
export const getTransactionSummary = async (req, res) => {
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
}; 