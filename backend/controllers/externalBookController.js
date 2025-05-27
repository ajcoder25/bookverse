const axios = require("axios");

const fetchGoogleBooks = async (req, res) => {
  const { q } = req.query; // Example: ?q=harry+potter
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { fetchGoogleBooks };
