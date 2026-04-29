const express = require('express');
const { getPersonalizedSuggestions } = require('../controllers/suggestionController');
const { protect, customer } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, customer, getPersonalizedSuggestions);

module.exports = router;
