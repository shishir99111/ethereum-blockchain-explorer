const express = require('express');
const app = express();
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '/.env') });

const etherscan = require('etherscan-api').init(process.env.API_KEY)

const { Client } = require('pg')
const postgres = new Client()
postgres.connect().catch((error) => { console.log('connecting to postgres: ' + error) })

// mounting routes
require('./router')(app);

app.listen(3000, () => console.log('listening on port 3000'))