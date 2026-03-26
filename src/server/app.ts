import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000, // Beri batas waktu 5 detik
});

const app = express();
app.use(express.json());

// Database Initialization
const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing. Skipping DB initialization.");
    return;
  }
  try {
    // Migrations
    await pool.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT");
    await pool.query("ALTER TABLE transactions ALTER COLUMN payment_method DROP NOT NULL");
    await pool.query("ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES transactions(id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fruits (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_kg DECIMAL(12, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory_batches (
        id SERIAL PRIMARY KEY,
        fruit_id INTEGER REFERENCES fruits(id),
        quantity DECIMAL(12, 2) NOT NULL,
        buy_price_per_kg DECIMAL(12, 2) NOT NULL,
        remaining_quantity DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL, -- 'sale', 'purchase', 'manual'
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(12, 2) NOT NULL,
        payment_method TEXT, -- 'cash', 'bank', 'debt', 'receivable'
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id),
        fruit_id INTEGER REFERENCES fruits(id),
        quantity DECIMAL(12, 2) NOT NULL,
        price_per_unit DECIMAL(12, 2) NOT NULL,
        cost_per_unit DECIMAL(12, 2) -- For sales, to track HPP
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT NOT NULL,
        account_name TEXT NOT NULL,
        debit DECIMAL(12, 2) DEFAULT 0,
        credit DECIMAL(12, 2) DEFAULT 0,
        transaction_id INTEGER REFERENCES transactions(id)
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        sub_category TEXT,
        account_name TEXT NOT NULL UNIQUE
      );

      -- Insert Default Accounts
      INSERT INTO accounts (category, sub_category, account_name) VALUES
      ('Aktiva', 'Aktiva Lancar', 'Kas'),
      ('Aktiva', 'Aktiva Lancar', 'Bank'),
      ('Aktiva', 'Aktiva Lancar', 'Piutang Dagang'),
      ('Aktiva', 'Aktiva Lancar', 'Piutang Lainnya'),
      ('Aktiva', 'Aktiva Lancar', 'Persediaan Barang'),
      ('Aktiva', 'Aktiva Lancar', 'Pajak dibayar dimuka'),
      ('Aktiva', 'Aktiva Lancar', 'Aktiva Lancar Lainnya'),
      ('Aktiva', 'Aktiva Tetap', 'Tanah dan/atau Bangunan'),
      ('Aktiva', 'Aktiva Tetap', 'Kendaraan'),
      ('Aktiva', 'Aktiva Tetap', 'Inventaris'),
      ('Aktiva', 'Aktiva Tetap', 'Akumulasi Penyusutan'),
      ('Aktiva', 'Aktiva Tidak Lancar Lainnya', 'Piutang Jangka Panjang'),
      ('Aktiva', 'Aktiva Tidak Lancar Lainnya', 'Biaya Ditangguhkan'),
      ('Pasiva', 'Pasiva Lancar', 'Utang Dagang'),
      ('Pasiva', 'Pasiva Lancar', 'Utang Gaji'),
      ('Pasiva', 'Pasiva Lancar', 'Utang Sewa'),
      ('Pasiva', 'Pasiva Lancar', 'Utang PPh 21'),
      ('Pasiva', 'Pasiva Lancar', 'Utang PPh 23'),
      ('Pasiva', 'Pasiva Lancar', 'Utang PPh 4(2)'),
      ('Pasiva', 'Pasiva Lancar', 'Utang PPN'),
      ('Pasiva', 'Pasiva Lancar', 'Pendapatan Diterima di Muka'),
      ('Pasiva', 'Pasiva Lancar', 'Utang Lancar Lainnya'),
      ('Pasiva', 'Pasiva Jangka Panjang', 'Utang Bank/Kredit Investasi'),
      ('Pasiva', 'Pasiva Jangka Panjang', 'Utang jangka panjang lainnya'),
      ('Ekuitas', NULL, 'Modal'),
      ('Ekuitas', NULL, 'Laba Ditahan'),
      ('Ekuitas', NULL, 'Laba Tahun Berjalan'),
      ('Pendapatan', NULL, 'Penjualan'),
      ('HPP', NULL, 'Persediaan Awal'),
      ('HPP', NULL, 'Pembelian'),
      ('HPP', NULL, 'Persediaan Akhir'),
      ('HPP', NULL, 'HPP'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Gaji'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya ATK'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Konsumsi'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya BPJS'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Sewa'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Jasa'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Listrik, air dan kebersihan'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Pajak'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Perijinan'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Asuransi'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Penyusutan'),
      ('Biaya', 'Biaya Umum dan Administrasi', 'Biaya Lainnya')
      ON CONFLICT (account_name) DO NOTHING;

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category TEXT NOT NULL, -- 'gaji', 'transport', 'penyusutan', 'sewa', 'lainnya'
        amount DECIMAL(12, 2) NOT NULL,
        description TEXT
      );

      -- Update journal entries to use fruit names and include quantity in kg with Indonesian decimal format (comma)
      UPDATE journal_entries j
      SET description = 
        CASE 
          WHEN j.description LIKE '%buah ID %' THEN REPLACE(j.description, 'buah ID ' || f.id::text, 'buah ' || f.name || ' ' || REPLACE(ti.quantity::text, '.', ',') || ' kg')
          WHEN j.description LIKE 'Penjualan buah %' AND j.description NOT LIKE '% kg' THEN 'Penjualan buah ' || f.name || ' ' || REPLACE(ti.quantity::text, '.', ',') || ' kg'
          WHEN j.description LIKE 'Pembelian buah %' AND j.description NOT LIKE '% kg' THEN 'Pembelian buah ' || f.name || ' ' || REPLACE(ti.quantity::text, '.', ',') || ' kg'
          WHEN j.description LIKE '% kg' AND j.description LIKE '%.%' THEN REPLACE(j.description, '.', ',')
          WHEN j.description LIKE 'HPP Penjualan ID %' THEN 'HPP Penjualan ' || f.name
          WHEN j.description LIKE 'Pengurangan persediaan ID %' THEN 'Pengurangan persediaan ' || f.name
          ELSE j.description
        END
      FROM transaction_items ti
      JOIN fruits f ON ti.fruit_id = f.id
      WHERE j.transaction_id = ti.transaction_id
      AND (
        j.description LIKE '%buah ID %' OR 
        (j.description LIKE '%buah %' AND j.description NOT LIKE '% kg') OR 
        (j.description LIKE '% kg' AND j.description LIKE '%.%') OR
        j.description LIKE 'HPP Penjualan ID %' OR
        j.description LIKE 'Pengurangan persediaan ID %'
      );
    `);
    console.log("Database initialized");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

let isDbInitialized = false;
const ensureDb = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Lewati inisialisasi untuk health check agar tidak gantung
  if (req.path === '/api/health') return next();

  if (!isDbInitialized && process.env.DATABASE_URL) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.error("Failed to initialize database on request:", err.message);
    }
  }
  next();
};

app.use(ensureDb);

// API Routes
app.get("/api/health", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
    await pool.query("SELECT 1");
    res.json({ 
      status: "ok", 
      database: "connected",
      env: {
        hasDbUrl: true,
        dbUrlLength: process.env.DATABASE_URL.length
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      database: "disconnected",
      error: err.message,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });
  }
});

app.get("/api/fruits", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM fruits ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/fruits", async (req, res) => {
  const { name, price_per_kg } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO fruits (name, price_per_kg) VALUES ($1, $2) RETURNING *",
      [name, price_per_kg]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/purchases", async (req, res) => {
  const { items, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const grandTotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0);

    const transResult = await client.query(
      "INSERT INTO transactions (type, total_amount, payment_method) VALUES ('purchase', $1, $2) RETURNING id",
      [grandTotal, payment_method]
    );
    const transaction_id = transResult.rows[0].id;

    for (const item of items) {
      const { fruit_id, quantity, total_price } = item;
      const buy_price_per_kg = total_price / quantity;

      const fruitRes = await client.query("SELECT name FROM fruits WHERE id = $1", [fruit_id]);
      const fruitName = fruitRes.rows[0]?.name || `ID ${fruit_id}`;

      await client.query(
        "INSERT INTO transaction_items (transaction_id, fruit_id, quantity, price_per_unit) VALUES ($1, $2, $3, $4)",
        [transaction_id, fruit_id, quantity, buy_price_per_kg]
      );

      await client.query(
        "INSERT INTO inventory_batches (fruit_id, quantity, buy_price_per_kg, remaining_quantity) VALUES ($1, $2, $3, $4)",
        [fruit_id, quantity, buy_price_per_kg, quantity]
      );

      const formattedQty = quantity.toString().replace('.', ',');
      // Jurnal Pembelian (Laba Rugi)
      await client.query(
        "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Pembelian buah ${fruitName} ${formattedQty} kg`, 'Pembelian', total_price, transaction_id]
      );

      // Jurnal Persediaan (Neraca vs Persediaan Akhir di HPP)
      await client.query(
        "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Pencatatan persediaan ${fruitName}`, 'Persediaan Barang', total_price, transaction_id]
      );
      await client.query(
        "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Penyesuaian persediaan akhir ${fruitName}`, 'Persediaan Akhir', total_price, transaction_id]
      );
    }

    const creditAccount = payment_method === 'cash' ? 'Kas' : payment_method === 'bank' ? 'Bank' : 'Hutang Dagang';
    await client.query(
      "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
      [`Pembayaran pembelian via ${payment_method}`, creditAccount, grandTotal, transaction_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, transaction_id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post("/api/sales", async (req, res) => {
  const { items, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const grandTotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0);

    const transResult = await client.query(
      "INSERT INTO transactions (type, total_amount, payment_method) VALUES ('sale', $1, $2) RETURNING id",
      [grandTotal, payment_method]
    );
    const transaction_id = transResult.rows[0].id;

    for (const item of items) {
      const { fruit_id, quantity, total_price } = item;
      
      let remainingToSell = quantity;
      let totalHPP = 0;

      const fruitRes = await client.query("SELECT name FROM fruits WHERE id = $1", [fruit_id]);
      const fruitName = fruitRes.rows[0]?.name || `ID ${fruit_id}`;

      const batches = await client.query(
        "SELECT * FROM inventory_batches WHERE fruit_id = $1 AND remaining_quantity > 0 ORDER BY created_at ASC",
        [fruit_id]
      );

      for (const batch of batches.rows) {
        if (remainingToSell <= 0) break;

        const take = Math.min(remainingToSell, batch.remaining_quantity);
        totalHPP += take * batch.buy_price_per_kg;
        remainingToSell -= take;

        await client.query(
          "UPDATE inventory_batches SET remaining_quantity = remaining_quantity - $1 WHERE id = $2",
          [take, batch.id]
        );
      }

      if (remainingToSell > 0) {
        throw new Error(`Stok ${fruitName} tidak mencukupi`);
      }

      await client.query(
        "INSERT INTO transaction_items (transaction_id, fruit_id, quantity, price_per_unit, cost_per_unit) VALUES ($1, $2, $3, $4, $5)",
        [transaction_id, fruit_id, quantity, total_price / quantity, totalHPP / quantity]
      );

      const formattedQty = quantity.toString().replace('.', ',');
      
      await client.query(
        "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Penjualan buah ${fruitName} ${formattedQty} kg`, 'Penjualan', total_price, transaction_id]
      );

      // Debit Persediaan Akhir (Laba Rugi) pada Kredit Persediaan Barang (Neraca)
      await client.query(
        "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Penyesuaian persediaan akhir (penjualan) ${fruitName}`, 'Persediaan Akhir', totalHPP, transaction_id]
      );
      await client.query(
        "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
        [`Pengurangan persediaan barang ${fruitName}`, 'Persediaan Barang', totalHPP, transaction_id]
      );
    }

    const debitAccount = payment_method === 'cash' ? 'Kas' : payment_method === 'bank' ? 'Bank' : 'Piutang Dagang';
    await client.query(
      "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
      [`Penerimaan penjualan via ${payment_method}`, debitAccount, grandTotal, transaction_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, transaction_id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.name, SUM(ib.remaining_quantity) as total_stock
      FROM fruits f
      LEFT JOIN inventory_batches ib ON f.id = ib.fruit_id
      GROUP BY f.id, f.name
      ORDER BY f.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/performance", async (req, res) => {
  const { period } = req.query;
  try {
    let query = "SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM transactions WHERE type = 'sale'";
    if (period === 'day') {
      query += " AND date::date = CURRENT_DATE";
    } else if (period === 'week') {
      query += " AND date >= date_trunc('week', CURRENT_DATE)";
    } else if (period === 'month') {
      query += " AND date >= date_trunc('month', CURRENT_DATE)";
    } else if (period === 'year') {
      query += " AND date >= date_trunc('year', CURRENT_DATE)";
    }
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/performance/details", async (req, res) => {
  const { period } = req.query;
  try {
    if (period === 'day') {
      const result = await pool.query(`
        SELECT t.date, j.description, j.credit as nominal
        FROM transactions t
        JOIN journal_entries j ON t.id = j.transaction_id
        WHERE t.type = 'sale' 
          AND t.date::date = CURRENT_DATE 
          AND j.account_name = 'Penjualan'
        ORDER BY t.date DESC
      `);
      res.json(result.rows);
    } else if (period === 'week') {
      const result = await pool.query(`
        WITH days AS (
          SELECT generate_series(
            date_trunc('week', CURRENT_DATE),
            date_trunc('week', CURRENT_DATE) + INTERVAL '6 days',
            '1 day'::interval
          ) as day
        )
        SELECT 
          CASE to_char(d.day, 'IDD')
            WHEN '1' THEN 'Senin'
            WHEN '2' THEN 'Selasa'
            WHEN '3' THEN 'Rabu'
            WHEN '4' THEN 'Kamis'
            WHEN '5' THEN 'Jumat'
            WHEN '6' THEN 'Sabtu'
            WHEN '7' THEN 'Minggu'
          END as day_name,
          COALESCE(SUM(t.total_amount), 0) as total
        FROM days d
        LEFT JOIN transactions t ON t.date::date = d.day::date AND t.type = 'sale'
        GROUP BY d.day
        ORDER BY d.day
      `);
      res.json(result.rows);
    } else if (period === 'month') {
      const result = await pool.query(`
        WITH days AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE),
            (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
            '1 day'::interval
          ) as day
        )
        SELECT 
          to_char(d.day, 'DD') as date,
          COALESCE(SUM(t.total_amount), 0) as total
        FROM days d
        LEFT JOIN transactions t ON t.date::date = d.day::date AND t.type = 'sale'
        GROUP BY d.day
        ORDER BY d.day
      `);
      res.json(result.rows);
    } else if (period === 'year') {
      const result = await pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('year', CURRENT_DATE),
            date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
            '1 month'::interval
          ) as month
        )
        SELECT 
          CASE to_char(m.month, 'MM')
            WHEN '01' THEN 'Januari'
            WHEN '02' THEN 'Februari'
            WHEN '03' THEN 'Maret'
            WHEN '04' THEN 'April'
            WHEN '05' THEN 'Mei'
            WHEN '06' THEN 'Juni'
            WHEN '07' THEN 'Juli'
            WHEN '08' THEN 'Agustus'
            WHEN '09' THEN 'September'
            WHEN '10' THEN 'Oktober'
            WHEN '11' THEN 'November'
            WHEN '12' THEN 'Desember'
          END as month_name,
          COALESCE(SUM(t.total_amount), 0) as total
        FROM months m
        LEFT JOIN transactions t ON date_trunc('month', t.date) = m.month AND t.type = 'sale'
        GROUP BY m.month
        ORDER BY m.month
      `);
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory/:fruitName/flow", async (req, res) => {
  const { fruitName } = req.params;
  try {
    const result = await pool.query(`
      WITH flow AS (
        SELECT 
          t.date,
          ti.quantity as keluar,
          0 as masuk,
          'Penjualan' as keterangan
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        JOIN fruits f ON ti.fruit_id = f.id
        WHERE f.name = $1 AND t.type = 'sale'
          AND t.date >= date_trunc('year', CURRENT_DATE)
          AND t.date < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'
        
        UNION ALL
        
        SELECT 
          t.date,
          0 as keluar,
          ti.quantity as masuk,
          'Pembelian' as keterangan
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        JOIN fruits f ON ti.fruit_id = f.id
        WHERE f.name = $1 AND t.type = 'purchase'
          AND t.date >= date_trunc('year', CURRENT_DATE)
          AND t.date < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'
      )
      SELECT 
        date, 
        keluar, 
        masuk, 
        keterangan,
        SUM(masuk - keluar) OVER (ORDER BY date ASC) as sisa
      FROM flow
      ORDER BY date DESC
    `, [fruitName]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/journals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM journal_entries ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/journals", async (req, res) => {
  const { description, debit_account, credit_account, amount } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const transResult = await client.query(
      "INSERT INTO transactions (type, total_amount, description) VALUES ('manual', $1, $2) RETURNING id",
      [amount, description]
    );
    const transaction_id = transResult.rows[0].id;

    await client.query(
      "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
      [description, debit_account, amount, transaction_id]
    );
    await client.query(
      "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
      [description, credit_account, amount, transaction_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, transaction_id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put("/api/journals/:id", async (req, res) => {
  const { id } = req.params;
  const { description, account_name, debit, credit } = req.body;
  try {
    const result = await pool.query(
      "UPDATE journal_entries SET description = $1, account_name = $2, debit = $3, credit = $4 WHERE id = $5 RETURNING *",
      [description, account_name, debit, credit, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/journals/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (password !== "admin123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const journalRes = await pool.query("SELECT transaction_id FROM journal_entries WHERE id = $1", [id]);
    const transaction_id = journalRes.rows[0]?.transaction_id;

    if (transaction_id) {
      await pool.query("DELETE FROM journal_entries WHERE transaction_id = $1", [transaction_id]);
      await pool.query("DELETE FROM transaction_items WHERE transaction_id = $1", [transaction_id]);
      await pool.query("DELETE FROM transactions WHERE id = $1", [transaction_id]);
    } else {
      await pool.query("DELETE FROM journal_entries WHERE id = $1", [id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM accounts ORDER BY category, sub_category, account_name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts", async (req, res) => {
  const { category, sub_category, account_name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO accounts (category, sub_category, account_name) VALUES ($1, $2, $3) RETURNING *",
      [category, sub_category, account_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/expenses", async (req, res) => {
  const { category, amount, description } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const transResult = await client.query(
      "INSERT INTO transactions (type, total_amount, description) VALUES ('expense', $1, $2) RETURNING id",
      [amount, description]
    );
    const transaction_id = transResult.rows[0].id;

    await client.query(
      "INSERT INTO expenses (category, amount, description) VALUES ($1, $2, $3)",
      [category, amount, description]
    );

    await client.query(
      "INSERT INTO journal_entries (description, account_name, debit, transaction_id) VALUES ($1, $2, $3, $4)",
      [description, category, amount, transaction_id]
    );
    await client.query(
      "INSERT INTO journal_entries (description, account_name, credit, transaction_id) VALUES ($1, $2, $3, $4)",
      [description, 'Kas', amount, transaction_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get("/api/reports/profit-loss", async (req, res) => {
  try {
    const salesRes = await pool.query("SELECT COALESCE(SUM(credit), 0) as total FROM journal_entries WHERE account_name = 'Penjualan'");
    const sales = parseFloat(salesRes.rows[0].total);

    const hppRes = await pool.query("SELECT COALESCE(SUM(debit), 0) as total FROM journal_entries WHERE account_name = 'HPP'");
    const hpp = parseFloat(hppRes.rows[0].total);

    const beginningInventoryRes = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = 'Persediaan Awal'");
    const beginningInventory = parseFloat(beginningInventoryRes.rows[0].total);

    const purchasesRes = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = 'Pembelian'");
    const purchases = parseFloat(purchasesRes.rows[0].total);

    const endingInventoryRes = await pool.query("SELECT COALESCE(SUM(credit) - SUM(debit), 0) as total FROM journal_entries WHERE account_name = 'Persediaan Akhir'");
    const endingInventory = parseFloat(endingInventoryRes.rows[0].total);

    const calculatedHPP = beginningInventory + purchases - endingInventory;

    const expenseCategories = [
      'Biaya Gaji', 'Biaya ATK', 'Biaya Konsumsi', 'Biaya BPJS', 'Biaya Sewa',
      'Biaya Jasa', 'Biaya Listrik, air dan kebersihan', 'Biaya Pajak',
      'Biaya Perijinan', 'Biaya Asuransi', 'Biaya Penyusutan', 'Biaya Lainnya'
    ];
    
    const expenseMapping: Record<string, string> = {
      'Biaya Gaji': 'biayaGaji',
      'Biaya ATK': 'biayaATK',
      'Biaya Konsumsi': 'biayaKonsumsi',
      'Biaya BPJS': 'biayaBPJS',
      'Biaya Sewa': 'biayaSewa',
      'Biaya Jasa': 'biayaJasa',
      'Biaya Listrik, air dan kebersihan': 'biayaListrikAirKebersihan',
      'Biaya Pajak': 'biayaPajak',
      'Biaya Perijinan': 'biayaPerijinan',
      'Biaya Asuransi': 'biayaAsuransi',
      'Biaya Penyusutan': 'biayaPenyusutan',
      'Biaya Lainnya': 'biayaLainnya'
    };
    
    const expenses: any = {};
    let totalExpenses = 0;

    for (const cat of Object.keys(expenseMapping)) {
      const res = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = $1", [cat]);
      const val = parseFloat(res.rows[0].total);
      expenses[expenseMapping[cat]] = val;
      totalExpenses += val;
    }
    expenses.total = totalExpenses;

    const grossProfit = sales - calculatedHPP;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      sales,
      beginningInventory,
      purchases,
      endingInventory,
      hpp: calculatedHPP,
      grossProfit,
      expenses,
      netProfit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/balance-sheet", async (req, res) => {
  try {
    const getBalance = async (accountName: string) => {
      const res = await pool.query("SELECT COALESCE(SUM(debit - credit), 0) as balance FROM journal_entries WHERE account_name = $1", [accountName]);
      return parseFloat(res.rows[0].balance);
    };

    const aktivaLancar = {
      kas: await getBalance('Kas'),
      bank: await getBalance('Bank'),
      piutangDagang: await getBalance('Piutang Dagang'),
      piutangLainnya: await getBalance('Piutang Lainnya'),
      persediaanBarang: await getBalance('Persediaan Barang'),
      pajakDibayarDimuka: await getBalance('Pajak dibayar dimuka'),
      aktivaLancarLainnya: await getBalance('Aktiva Lancar Lainnya'),
      total: 0
    };
    aktivaLancar.total = Object.values(aktivaLancar).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    const aktivaTetap = {
      tanahBangunan: await getBalance('Tanah dan/atau Bangunan'),
      kendaraan: await getBalance('Kendaraan'),
      inventaris: await getBalance('Inventaris'),
      akumulasiPenyusutan: Math.abs(await getBalance('Akumulasi Penyusutan')),
      total: 0
    };
    aktivaTetap.total = aktivaTetap.tanahBangunan + aktivaTetap.kendaraan + aktivaTetap.inventaris - aktivaTetap.akumulasiPenyusutan;

    const aktivaTidakLancarLainnya = {
      piutangJangkaPanjang: await getBalance('Piutang Jangka Panjang'),
      biayaDitangguhkan: await getBalance('Biaya Ditangguhkan'),
      total: 0
    };
    aktivaTidakLancarLainnya.total = aktivaTidakLancarLainnya.piutangJangkaPanjang + aktivaTidakLancarLainnya.biayaDitangguhkan;

    const totalAktiva = aktivaLancar.total + aktivaTetap.total + aktivaTidakLancarLainnya.total;

    const pasivaLancar = {
      utangDagang: Math.abs(await getBalance('Utang Dagang')),
      utangGaji: Math.abs(await getBalance('Utang Gaji')),
      utangSewa: Math.abs(await getBalance('Utang Sewa')),
      utangPPh21: Math.abs(await getBalance('Utang PPh 21')),
      utangPPh23: Math.abs(await getBalance('Utang PPh 23')),
      utangPPh4_2: Math.abs(await getBalance('Utang PPh 4(2)')),
      utangPPN: Math.abs(await getBalance('Utang PPN')),
      pendapatanDiterimaDimuka: Math.abs(await getBalance('Pendapatan Diterima di Muka')),
      utangLancarLainnya: Math.abs(await getBalance('Utang Lancar Lainnya')),
      total: 0
    };
    pasivaLancar.total = Object.values(pasivaLancar).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    const pasivaJangkaPanjang = {
      utangBank: Math.abs(await getBalance('Utang Bank/Kredit Investasi')),
      utangJangkaPanjangLainnya: Math.abs(await getBalance('Utang jangka panjang lainnya')),
      total: 0
    };
    pasivaJangkaPanjang.total = pasivaJangkaPanjang.utangBank + pasivaJangkaPanjang.utangJangkaPanjangLainnya;

    // Hitung Laba Bersih untuk disinkronkan ke Neraca
    const salesRes = await pool.query("SELECT COALESCE(SUM(credit) - SUM(debit), 0) as total FROM journal_entries WHERE account_name = 'Penjualan'");
    const sales = parseFloat(salesRes.rows[0].total);

    const beginningInventoryRes = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = 'Persediaan Awal'");
    const beginningInventory = parseFloat(beginningInventoryRes.rows[0].total);

    const purchasesRes = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = 'Pembelian'");
    const purchases = parseFloat(purchasesRes.rows[0].total);

    const endingInventoryRes = await pool.query("SELECT COALESCE(SUM(credit) - SUM(debit), 0) as total FROM journal_entries WHERE account_name = 'Persediaan Akhir'");
    const endingInventory = parseFloat(endingInventoryRes.rows[0].total);

    const hpp = beginningInventory + purchases - endingInventory;
    const grossProfit = sales - hpp;

    const expenseCategories = [
      'Biaya Gaji', 'Biaya ATK', 'Biaya Konsumsi', 'Biaya BPJS', 'Biaya Sewa',
      'Biaya Jasa', 'Biaya Listrik, air dan kebersihan', 'Biaya Pajak',
      'Biaya Perijinan', 'Biaya Asuransi', 'Biaya Penyusutan', 'Biaya Lainnya'
    ];
    let totalExpenses = 0;
    for (const cat of expenseCategories) {
      const res = await pool.query("SELECT COALESCE(SUM(debit) - SUM(credit), 0) as total FROM journal_entries WHERE account_name = $1", [cat]);
      totalExpenses += parseFloat(res.rows[0].total);
    }
    const netProfit = grossProfit - totalExpenses;

    const ekuitas = {
      modal: Math.abs(await getBalance('Modal')),
      labaDitahan: Math.abs(await getBalance('Laba Ditahan')),
      labaTahunBerjalan: netProfit,
      total: 0
    };
    ekuitas.total = ekuitas.modal + ekuitas.labaDitahan + ekuitas.labaTahunBerjalan;

    const totalPasiva = pasivaLancar.total + pasivaJangkaPanjang.total + ekuitas.total;

    res.json({
      aktivaLancar,
      aktivaTetap,
      aktivaTidakLancarLainnya,
      totalAktiva,
      pasivaLancar,
      pasivaJangkaPanjang,
      ekuitas,
      totalPasiva
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
