import express from 'express';
import dotenv from 'dotenv';
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const accountId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    try {
        const result = await pool.query(
            "SELECT 1 FROM likes WHERE account_id = $1 AND film_id = $2 LIMIT 1;",
            [accountId, filmId]
        );
        const isLiked = result.rowCount > 0;

        return res.status(200).json({ message: "Check save data successfully.", isLiked: isLiked });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/like', authenticateToken, async (req, res) => {
    const accountId = req.user.id;
    const { filmId } = req.body;
   
    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    try {
        await pool.query(
            "INSERT INTO likes (account_id, film_id) VALUES ($1, $2) ON CONFLICT (account_id, film_id) DO NOTHING;",
            [accountId, filmId]
        );
        return res.status(201).json({ message: "Liked successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/dislike', authenticateToken, async (req, res) => {
    const accountId = req.user.id;
    const { filmId } = req.body;
   
    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }
    try {
        await pool.query(
            "DELETE FROM likes WHERE account_id = $1 AND film_id = $2;",
            [accountId, filmId]
        );
        return res.status(200).json({ message: "Disliked successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;