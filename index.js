import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import accountsRoutes from "./routes/accounts.js";
import filmsRoutes from "./routes/films.js";

dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors());
app.use("/accounts", accountsRoutes);
app.use("/films", filmsRoutes);

const supabaseUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})