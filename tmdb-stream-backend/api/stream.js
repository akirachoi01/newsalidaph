import axios from 'axios';

const TMDB_API_KEY = 'ba3885a53bc2c4f3c4b5bdc1237e69a0'; // Replace with real or use env var

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing TMDB id' });
  }

  try {
    const tmdb = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`
    );
    const { title, release_date } = tmdb.data;

    const streamUrl = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
    res.json({ tmdbId: id, title, release_date, streamUrl });
  } catch (e) {
    console.error('TMDB fetch error:', e.message);
    res.status(500).json({ error: 'TMDB data fetch failed' });
  }
}
