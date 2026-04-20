require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ─── Route Imports ────────────────────────────────────────────────────────────

const adminAuthRoutes      = require('./routes/admin.auth.routes');
const companyAuthRoutes    = require('./routes/company.auth.routes');
const adminCompanyRoutes   = require('./routes/admin.companies.routes');
const adminTrainingRoutes  = require('./routes/admin.trainings.routes');
const sessionRoutes        = require('./routes/session.routes');

const app = express();



app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://admin-dashbord-mypfe.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'TynassIt API is running' });
});

// ─── Company Routes (Quest headset app) ───────────────────────────────────────

app.use('/api/company/auth', companyAuthRoutes);

// ─── Admin Routes (Tynass admin panel) ───────────────────────────────────────

app.use('/api/admin/auth',      adminAuthRoutes);
app.use('/api/admin/companies', adminCompanyRoutes);
app.use('/api/admin/trainings', adminTrainingRoutes);
app.use('/api/sessions',        sessionRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Database + Server ───────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL, {
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(async () => {
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });