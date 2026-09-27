const express = require('express');
const cors = require('cors');
const db = require('./db');
const stripe = require('stripe')('sk_test_51MockSecretKeyForBorcelleAgriDevelopment00000000000000');

const app = express();
app.use(cors());
app.use(express.json());

// --- USERS ---
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { id, name, email, password, role, joined, scans, status } = req.body;
  db.run(`INSERT INTO users (id, name, email, password, role, joined, scans, status) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, email, password, role, joined, scans, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, email, role });
    }
  );
});

// For admin updating user
app.put('/api/users/:id', (req, res) => {
  const { name, email, role, status } = req.body;
  db.run(`UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?`,
    [name, email, role, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// For admin deleting user
app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id=?`, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- ORDERS ---
app.get('/api/orders/:userId', (req, res) => {
  db.all('SELECT * FROM orders WHERE userId=? ORDER BY date DESC', [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse items JSON
    const parsed = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
    res.json(parsed);
  });
});

app.post('/api/orders', (req, res) => {
  const { id, userId, date, items, total } = req.body;
  db.run(`INSERT INTO orders (id, userId, date, items, total) VALUES (?,?,?,?,?)`,
    [id, userId, date, JSON.stringify(items), total],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- SCANS ---
app.get('/api/scans/:userId', (req, res) => {
  db.all('SELECT * FROM scans WHERE userId=? ORDER BY date DESC', [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/scans', (req, res) => {
  const { id, userId, crop, disease, acc, icon, date } = req.body;
  db.run(`INSERT INTO scans (id, userId, crop, disease, acc, icon, date) VALUES (?,?,?,?,?,?,?)`,
    [id, userId, crop, disease, acc, icon, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // Update scan count for user
      db.run(`UPDATE users SET scans = scans + 1 WHERE id=?`, [userId]);
      res.json({ success: true });
    }
  );
});

// --- COMMUNITY POSTS ---
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/posts', (req, res) => {
  const { id, userId, authorName, authorRole, title, content, date } = req.body;
  db.run(`INSERT INTO posts (id, userId, authorName, authorRole, title, content, date, replies) VALUES (?,?,?,?,?,?,?, 0)`,
    [id, userId, authorName, authorRole, title, content, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- POST REPLIES ---
app.get('/api/posts/:postId/replies', (req, res) => {
  db.all('SELECT * FROM replies WHERE postId=? ORDER BY date ASC', [req.params.postId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/posts/:postId/replies', (req, res) => {
  const { id, userId, authorName, authorRole, content, date } = req.body;
  const postId = req.params.postId;
  db.run(`INSERT INTO replies (id, postId, userId, authorName, authorRole, content, date) VALUES (?,?,?,?,?,?,?)`,
    [id, postId, userId, authorName, authorRole, content, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // Update replies count
      db.run(`UPDATE posts SET replies = replies + 1 WHERE id=?`, [postId]);
      res.json({ success: true });
    }
  );
});

// --- STRIPE PAYMENT ---
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amounts in cents/paise
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
