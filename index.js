import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from "path";
import { fileURLToPath } from 'url';
import accountsRoutes from "./routes/accounts.js";
import filmsRoutes from "./routes/films.js";
import uploadRoutes from "./routes/upload.js";
import saveRoutes from "./routes/save.js";
import likeRoutes from "./routes/like.js";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
});

const app = express();
app.use(express.json()); 
app.use(cors());
app.use("/accounts", accountsRoutes);
app.use("/films", filmsRoutes);
app.use("/upload", uploadRoutes);
app.use("/save", saveRoutes);
app.use("/like", likeRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILM_DIR = path.join(__dirname, '/storage/films');
app.use('/storage/films', express.static(FILM_DIR));
const THUMBNAIL_DIR = path.join(__dirname, '/storage/thumbnails');
app.use('/storage/thumbnails', express.static(THUMBNAIL_DIR));

export { pool };

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})