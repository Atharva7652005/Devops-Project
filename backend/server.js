require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const requestRoutes = require('./routes/requestRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const promoRoutes = require('./routes/promoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const path = require('path');

const port = process.env.PORT || 5000;

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin/catalog', catalogRoutes);
app.use('/api/admin/technicians', technicianRoutes);
app.use('/api/admin/promos', promoRoutes);
app.use('/api/admin/requests', adminRoutes); // Using adminRoutes for base admin routes

// Error Handling Middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
