// index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a mongoose schema for Photo
const photoSchema = new mongoose.Schema({
  location: String, // Store the file location
  location2: String,
  date: {
    type: Date,
    default: Date.now
  }
});


const Photo = mongoose.model('Photo', photoSchema);

// User schema for authentication
const userSchema = new mongoose.Schema({
  name: String,
  eid: Number,
  password: String,
  mobileNumber: String,
});
const User = mongoose.model('User', userSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Save uploaded files to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Generate unique filename
  }
});
const upload = multer({ storage: storage });

// Middleware for parsing JSON body
app.use(express.json());

// API endpoint to upload multiple photos
app.post('/upload', upload.array('photos', 2), async (req, res) => {
  try {
    const files = req.files;
    const photoLocations = [];

    // Save the file locations to MongoDB
    for (let i = 0; i < files.length; i += 2) {
      const photo1 = new Photo({ location: files[i].path });
      const photo2 = new Photo({ location: files[i + 1].path });
      await photo1.save();
      await photo2.save();
      photoLocations.push(photo1.location, photo2.location);
    }

    res.status(201).json({ message: 'Photos uploaded successfully!', locations: photoLocations });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint to get all photos
app.get('/photos', async (req, res) => {
  try {
    // Retrieve all photos from the database
    const photos = await Photo.find();
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Login endpoint for user authentication
app.post('/api/login', async (req, res) => {
  const { eid, password } = req.body;

  try {
    // Find the user by eid
    const user = await User.findOne({ eid });

    if (!user) {
      // User not found
      return res.status(401).json({ error: 'Invalid eid or password' });
    }

    // Compare the entered password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Passwords match, authentication successful
      res.status(200).json({ message: 'Authentication successful' });
    } else {
      // Passwords don't match, authentication failed
      res.status(401).json({ error: 'Invalid eid or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register a new user with hashed password
app.post('/api/register', async (req, res) => {
  const { name, eid, password, mobileNumber } = req.body;

  try {
    // Check if the eid is already registered
    const existingUser = await User.findOne({ eid });

    if (existingUser) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password, mobile number
    const newUser = new User({
      name,
      eid,
      password: hashedPassword,
      mobileNumber
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
