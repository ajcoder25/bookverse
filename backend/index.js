const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const config = require("./config");

// Load environment variables from .env file
dotenv.config();

// Use environment variables or fall back to config.js
const MONGO_URI = process.env.MONGO_URI || config.MONGO_URI;
const PORT = process.env.PORT || 10000; // Default to 10000 for Render

console.log("Using MONGO_URI:", MONGO_URI);
console.log("Using PORT:", PORT);

const app = express();

const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const externalBookRoutes = require("./routes/externalBookRoutes");
const addressRoutes = require("./routes/addressRoutes");
const cartRoutes = require("./routes/cartRoutes");

// Configure CORS - More permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    const allowedOrigins = [
      'https://bookverse-1-9e7p.onrender.com',
      'https://your-frontend-domain.com' // Replace with your actual frontend domain
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-auth-token',
    'x-requested-with'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Log CORS configuration for debugging
console.log('CORS Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN
});

app.use(cors(corsOptions));
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/external-books", externalBookRoutes);

// DB connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
