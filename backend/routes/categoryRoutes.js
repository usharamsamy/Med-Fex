const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, retailer } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCategories)
    .post(protect, retailer, createCategory);

router.delete('/:id', protect, retailer, deleteCategory);

module.exports = router;
