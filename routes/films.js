import express from 'express';
import dotenv from 'dotenv';
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Send all films
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films;",
        );
        return res.status(200).json({ message: "Films retrieved successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Send a film information
router.post('/film', authenticateToken, async (req, res) => {
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    try {
        const filmData = await pool.query(
            `SELECT 
                * 
            FROM 
                films
            WHERE
                id = $1;
            `,
            [filmId]
        );

        if (filmData.rows.length < 1) {
            return res.status(200).json({ message: "Films not found." });
        }

        try {
            const crewData = await pool.query(
                `SELECT 
                    * 
                FROM 
                    crew
                WHERE
                    film_id = $1;
                `,
                [filmId]
            );
            return res.status(200).json({ message: "Films retrieved successfully.", filmData: filmData.rows, crewData: crewData.rows });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Send trending films
router.get('/trending', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                f.* 
            FROM 
                films f 
            LEFT JOIN 
                likes l 
            ON 
                f.id = l.film_id 
            WHERE 
                f.created_at >= NOW() - INTERVAL '7 days' 
            GROUP BY 
                f.id 
            ORDER BY 
                COUNT(l.id) 
            DESC LIMIT 
                10;
            `
        );
        return res.status(200).json({ message: "Trending films retrieved successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Send latest films
router.get('/latest', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films ORDER BY created_at DESC LIMIT 10;"
        );
        return res.status(200).json({ message: "Latest films retrieved successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;