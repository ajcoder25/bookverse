const express = require("express");
const {
  getCategories,
  getCategoryById,
} = require("../../controllers/categoryController");

const router = express.Router();

router.get("/", getCategories);
router.get("/:categoryId", getCategoryById);

module.exports = router;
