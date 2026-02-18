const express = require('express');
const { getPersonalizedSuggestions } = require('../controllers/suggestionController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getPersonalizedSuggestions);

module.exports = router;
