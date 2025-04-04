import express from 'express';
import dotenv from 'dotenv';
import path from "path";
import multer from 'multer';
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Add a new film
router.post('/', authenticateToken, async (req, res) => {
    const { filmUrl, thumbnailUrl, title, description, genre, crew } = req.body;
  
    if (!filmUrl || !thumbnailUrl || !title || !genre) {
      return res.status(400).json({ error: "Urls, title and genre are required." });
    }

    console.log(req.body);
  
    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO 
                films (account_id, film_url, thumbnail_url, title, description, genre) 
            VALUES 
                ($1, $2, $3, $4, $5, $6) 
            RETURNING
                id, account_id, film_url, thumbnail_url, title, description, genre, created_at`,
            [accountId, filmUrl, thumbnailUrl, title, description, genre]
        );

        const filmId = result.rows[0].id;

        if (crew.length > 0) {
            await Promise.all(crew.map(async (member) => {
                await pool.query(
                    `INSERT INTO 
                        crew (film_id, role, name, email) 
                    VALUES 
                        ($1, $2, $3, $4)`,
                    [filmId, member.role, member.name, member.email]
                );
            }));
        }
        return res.status(201).json({ message: "Film upload successful."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// Upload a film data
const filmStorage = multer.diskStorage({
    destination: "./storage/films",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const filmUpload = multer({ storage: filmStorage });

router.post("/file/film", authenticateToken, filmUpload.single("film"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Upload a film successful', url: `/storage/films/${req.file.filename}` }); 
    }
});


// Upload a thumbnail data
const thumbnailStorage = multer.diskStorage({
    destination: "./storage/thumbnails",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const thumbnailUpload = multer({ storage: thumbnailStorage });

router.post("/file/thumbnail", authenticateToken, thumbnailUpload.single("thumbnail"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Upload a thumbnail successful', url: `/storage/thumbnails/${req.file.filename}` }); 
    }
});

export default router;