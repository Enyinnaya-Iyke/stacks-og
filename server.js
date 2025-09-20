const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'users.json');

app.use(express.static('public'));
app.use(bodyParser.json());

// Load or initialize DB
let users = [];
if (fs.existsSync(DATA_FILE)) {
  users = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save DB helper
function saveUsers() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// Add user or return existing
app.post('/api/submit', (req, res) => {
  const { address, firstTxISO } = req.body;
  if (!address || !firstTxISO) return res.status(400).json({ error: 'Missing data' });

  // Check if already exists
  const existing = users.find(u => u.address === address);
  if (!existing) {
    users.push({ address, firstTxISO });
    users.sort((a, b) => new Date(a.firstTxISO) - new Date(b.firstTxISO));
    saveUsers();
  }

  // Compute rank
  const sorted = users.sort((a, b) => new Date(a.firstTxISO) - new Date(b.firstTxISO));
  const rank = sorted.findIndex(u => u.address === address) + 1;
  const total = sorted.length;

  res.json({ rank, total });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
