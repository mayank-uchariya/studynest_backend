const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const exampleRoutes = require('./routes/exampleRoutes');
const errorHandler = require('./utils/errorHandler');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/examples', exampleRoutes);

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
