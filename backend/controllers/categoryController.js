const Category = require('../models/Category');

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (exists) return res.status(400).json({ message: 'Category already exists' });

        const category = new Category({ name, description, retailer: req.user._id });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: 'Error creating category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
};

module.exports = { getCategories, createCategory, deleteCategory };
