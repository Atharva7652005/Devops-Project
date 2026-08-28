require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const socket = require('./config/socket');
const http = require('http');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const requestRoutes = require('./routes/requestRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const technicianRoutes = require('./routes/technicianRoutes');

const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const techAppRoutes = require('./routes/techAppRoutes');

const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

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
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/catalog', catalogRoutes);
app.use('/api/admin/technicians', technicianRoutes);
app.use('/api/admin/inventory', inventoryRoutes);

app.use('/api/admin', adminRoutes); // Using adminRoutes for base admin routes

// Core features
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);

// Technician App features
app.use('/api/technician', techAppRoutes);

// Error Handling Middleware
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
