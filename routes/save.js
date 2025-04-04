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
            "SELECT 1 FROM save WHERE account_id = $1 AND film_id = $2 LIMIT 1;",
            [accountId, filmId]
        );
        const isSaved = result.rowCount > 0;

        return res.status(200).json({ message: "Check save data successfully.", isSaved: isSaved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/true', authenticateToken, async (req, res) => {
    const accountId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    try {
        await pool.query(
            `INSERT INTO 
                save (account_id, film_id) 
            VALUES 
                ($1, $2) 
            ON CONFLICT 
                (account_id, film_id) 
            DO NOTHING;`,
            [accountId, filmId]
        );
        return res.status(201).json({ message: "Saved successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/false', authenticateToken, async (req, res) => {
    const accountId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    try {
        await pool.query(
            "DELETE FROM save WHERE account_id = $1 AND film_id = $2;",
            [accountId, filmId]
        );
        return res.status(200).json({ message: "Unsaved successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Send watchlist
router.get('/watchlist', authenticateToken, async (req, res) => {
    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (f.id) 
                f.id AS film_id,
                f.title,
                f.description,
                f.genre,
                f.film_url,
                f.thumbnail_url,
                f.created_at
            FROM
                save s
            JOIN
                films f ON s.film_id = f.id
            WHERE
                s.account_id = $1;
            `,
            [accountId]
        );

        return res.status(200).json({ message: "Films retrieved successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;