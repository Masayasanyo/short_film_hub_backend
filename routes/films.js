import express from 'express';
import { supabase } from "../index.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Check if user has a token.
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied, token missing', isLoggedIn: false });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token', isLoggedIn: false});
    }
    req.user = decoded;
    next();
  });
}

// Add a new film
router.post('/upload', authenticateToken, async (req, res) => {
    const { filmUrl, thumbnailUrl, title, description, genre, crew } = req.body;
  
    if (!filmUrl || !thumbnailUrl || !title || !genre) {
      return res.status(400).json({ error: "Urls, title and genre are required." });
    }
  
    const accountId = req.user.id;
  
    const { data: filmData, error: filmError } = await supabase
        .from('films')
        .insert({ 
            film_url: filmUrl, 
            thumbnail_url: thumbnailUrl, 
            title: title, 
            description: description, 
            genre: genre, 
            account_id: accountId 
        })
        .select()
  
    if (filmError) {
        console.error(filmError);
        return res.status(500).json({ error: "Internal server error." });
    }
    const filmId = filmData[0].id;
  
    for (let i = 0; i < crew.length; i++){
        const { data: crewData, error: crewError } = await supabase
            .from('crew')
            .insert({ film_id: filmId, role: crew[i].role, name: crew[i].name })
            .select()

        if (crewError) {
            console.error(crewError);
            return res.status(500).json({ error: "Internal server error." });
        }
    }  
    return res.status(201).json({ message: "Film upload successful."});
});

// Upload a film data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload/file/film', authenticateToken, upload.single('file'), async function (req, res) {
    try {
        const file = req.file;

        console.log(file);

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const uniqueSuffix = Math.random().toString(26).substring(4, 10);
        const fileName = `${Date.now()}-${uniqueSuffix}-${file.originalname}`;

        const { data, error } = await supabase.storage
            .from("film-videos")
            .upload(fileName, file.buffer, {
                contentType: file.mimetype, 
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }

        const { data: image } = supabase.storage
            .from("film-videos")
            .getPublicUrl(data.path);

        return res.status(201).json({ message: "Upload a film file successful.", url: image.publicUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/upload/file/thumbnail', authenticateToken, upload.single('file'), async function (req, res) {
    try {
        const file = req.file;

        console.log(file);

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const uniqueSuffix = Math.random().toString(26).substring(4, 10);
        const fileName = `${Date.now()}-${uniqueSuffix}-${file.originalname}`;

        const { data, error } = await supabase.storage
            .from("thumbnail-images")
            .upload(fileName, file.buffer, {
                contentType: file.mimetype, 
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }

        const { data: image } = supabase.storage
            .from("thumbnail-images")
            .getPublicUrl(data.path);

        return res.status(201).json({ message: "Upload a thumbnail file successful.", url: image.publicUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Send all films
router.get('/all', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
        .from('films')
        .select(` 
            id, 
            film_url, 
            thumbnail_url, 
            title, 
            description, 
            genre, 
            account_id
        `);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Films retrieved successfully.", data: data });
});

// Send a film information
router.post('/film', authenticateToken, async (req, res) => {
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    const { data, error } = await supabase
        .from('films')
        .select(` 
            id, 
            film_url, 
            thumbnail_url, 
            title, 
            description, 
            genre, 
            account_id, 
            created_at, 
            crew ( 
                name, 
                role 
            )
        `)
        .eq('id', filmId);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Film retrieved successfully.", data: data });
});

// Send trending films
router.get('/trending', authenticateToken, async (req, res) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
        .from('films')
        .select(` 
            id, 
            film_url, 
            thumbnail_url, 
            title, 
            description, 
            genre, 
            account_id, 
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Trending films retrieved successfully.", data: data });
});

// Send latest films
router.get('/latest', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
        .from('films')
        .select(` 
            id, 
            film_url, 
            thumbnail_url, 
            title, 
            description, 
            genre, 
            account_id, 
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Latest films retrieved successfully.", data: data });
});

// save or unsave film
router.post('/save', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    const { data: existingSave, error: fetchError } = await supabase
        .from('save')
        .select('id')
        .eq('account_id', userId)
        .eq('film_id', filmId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(fetchError);
        return res.status(500).json({ error: "Internal server error." });
    }

    if (existingSave) {
        const { error: deleteError } = await supabase
            .from('save')
            .delete()
            .eq('account_id', userId)
            .eq('film_id', filmId);

        if (deleteError) {
            console.error(deleteError);
            return res.status(500).json({ error: "Failed to unsave." });
        }

        return res.status(200).json({ message: "Unsaved successfully.", isSaved: false });
    } else {
        const { error: insertError } = await supabase
            .from('save')
            .insert({ account_id: userId, film_id: filmId })
            .select();

        if (insertError) {
            console.error(insertError);
            return res.status(500).json({ error: "Failed to save." });
        }

        return res.status(200).json({ message: "Saved successfully.", isSaved: true });
    }
});

// check saved or not
router.post('/save/check', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    const { data: existingSave, error: fetchError } = await supabase
        .from('save')
        .select('id')
        .eq('account_id', userId)
        .eq('film_id', filmId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(fetchError);
        return res.status(500).json({ error: "Internal server error.", isSaved: false });
    }

    if (existingSave) {
        return res.status(200).json({ message: "The film is aleady saved.", isSaved: true });
    } else {
        return res.status(200).json({ message: "The film is not saved yet.", isSaved: false });
    }
});

// like or dislike film
router.post('/like', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    const { data: existingLike, error: fetchError } = await supabase
        .from('like')
        .select('id')
        .eq('account_id', userId)
        .eq('film_id', filmId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(fetchError);
        return res.status(500).json({ error: "Internal server error." });
    }

    if (existingLike) {
        const { error: deleteError } = await supabase
            .from('like')
            .delete()
            .eq('account_id', userId)
            .eq('film_id', filmId);

        if (deleteError) {
            console.error(deleteError);
            return res.status(500).json({ error: "Failed to remove like." });
        }

        return res.status(200).json({ message: "Like removed successfully.", isLiked: false });
    } else {
        const { error: insertError } = await supabase
            .from('like')
            .insert({ account_id: userId, film_id: filmId })
            .select();

        if (insertError) {
            console.error(insertError);
            return res.status(500).json({ error: "Failed to add like." });
        }

        return res.status(200).json({ message: "Like added successfully.", isLiked: true });
    }
});

// check liked or not
router.post('/like/check', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "Film id is required." });
    }

    const { data: existingSave, error: fetchError } = await supabase
        .from('like')
        .select('id')
        .eq('account_id', userId)
        .eq('film_id', filmId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(fetchError);
        return res.status(500).json({ error: "Internal server error.", isLiked: false });
    }

    if (existingSave) {
        return res.status(200).json({ message: "You've already liked this film.", isLiked: true });
    } else {
        return res.status(200).json({ message: "You've not liked this film yet.", isLiked: false });
    }
});

// Send watchlist
router.get('/watchlist', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabase
        .from('save')
        .select(`
            id, 
            film_id, 
            account_id, 
            films (
                id, 
                thumbnail_url, 
                title
            )
        `)
        .eq('account_id', userId);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Films retrieved successfully.", data: data });
});

export default router;