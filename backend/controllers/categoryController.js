const Category = require("../models/categoryModel");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ data: { categories } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ data: { category } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCategories, getCategoryById };