// Required modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize dotenv to load environment variables
dotenv.config();

// Create an Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware to handle JSON data
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Error connecting to MongoDB:', err));


// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Episode schema and model
const episodeSchema = new mongoose.Schema({
  title: String,
  description: String,
  filePath: String,
});
const Episode = mongoose.model('Episode', episodeSchema);

// Route to upload podcast episode audio
app.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const newEpisode = {
    title: req.body.title,
    description: req.body.description,
    filePath: `/uploads/${req.file.filename}`,
  };

  try {
    const episode = new Episode(newEpisode);
    await episode.save();
    res.status(200).send('Episode uploaded successfully.');
  } catch (err) {
    res.status(500).send('Error saving episode metadata.');
  }
});

// Route to fetch all episodes (metadata)
app.get('/episodes', async (req, res) => {
  try {
    const episodes = await Episode.find();
    res.status(200).json(episodes);
  } catch (err) {
    res.status(500).send('Error fetching episodes.');
  }
});

// Route to download an episode
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
