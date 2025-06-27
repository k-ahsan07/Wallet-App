import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import transactionRoute from './routes/transactionRoute.js'
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

app.use("/api/transactions",transactionRoute)



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