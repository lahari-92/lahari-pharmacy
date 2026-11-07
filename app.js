
const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("MySQL Database Connected Successfully!");
    }
});

// Allowed tables and columns
const tables = {
    users: ['name', 'email', 'password', 'phone', 'role'],
    medicines: [
        'medicine_name', 'description', 'category',
        'manufacturer', 'price', 'stock', 'expiry_date'
    ],
    orders: ['user_id', 'order_date', 'total_amount', 'status'],
    order_items: ['order_id', 'medicine_id', 'quantity', 'price']
};

const primaryKeys = {
    users: 'user_id',
    medicines: 'medicine_id',
    orders: 'order_id',
    order_items: 'item_id'
};

// READ all records
app.get('/api/:table', (req, res) => {
    const table = req.params.table;

    if (!tables[table]) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    db.query(`SELECT * FROM ${table}`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// CREATE record
app.post('/api/:table', (req, res) => {
    const table = req.params.table;

    if (!tables[table]) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const columns = tables[table];
    const values = columns.map(col => req.body[col]);

    if (columns.some((col, i) =>
        values[i] === undefined || values[i] === ''
    )) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }

    const sql = `INSERT INTO ${table} (${columns.join(',')})
                 VALUES (${columns.map(() => '?').join(',')})`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            message: 'Record added successfully',
            id: result.insertId
        });
    });
});

// UPDATE record
app.put('/api/:table/:id', (req, res) => {
    const table = req.params.table;

    if (!tables[table]) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const columns = tables[table];
    const values = columns.map(col => req.body[col]);

    if (columns.some((col, i) =>
        values[i] === undefined || values[i] === ''
    )) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }

    const key = primaryKeys[table];

    const sql = `UPDATE ${table} SET
                 ${columns.map(col => `${col} = ?`).join(', ')}
                 WHERE ${key} = ?`;

    db.query(sql, [...values, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Record updated successfully' });
    });
});

// DELETE record
app.delete('/api/:table/:id', (req, res) => {
    const table = req.params.table;

    if (!tables[table]) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const key = primaryKeys[table];

    db.query(
        `DELETE FROM ${table} WHERE ${key} = ?`,
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: 'Record deleted successfully' });
        }
    );
});

// Test route
app.get('/test', (req, res) => {
    res.send('Lahari Online Pharmacy is Working!');
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
