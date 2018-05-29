const express = require('express');
const path = require('path');

const app = express();

require('dotenv').config({ path: path.join(__dirname, '/.env') });

const { pool } = require('./db').pg;

pool.connect();

// mounting routes
require('./router')(app);

app.listen(3000, () => console.log('listening on port 3000'));