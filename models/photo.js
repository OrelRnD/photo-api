// models/Photo.js

const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  data: String,
});

module.exports = mongoose.model('Photo', photoSchema);
