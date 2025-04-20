const db = require("../utils/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { nama, email, password } = req.body;

  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email sudah digunakan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.query(
      "INSERT INTO users (nama, email, password) VALUES ($1, $2, $3) RETURNING id, nama, email",
      [nama, email, hashedPassword],
    );

    res
      .status(201)
      .json({ message: "Registrasi berhasil", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan saat registrasi" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Email  atau password salah" });
    }

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ message: "Login berhasil", token, id: user.rows[0].id, nama: user.rows[0].nama, role: user.rows[0].role });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan saat login" });
  }
};

module.exports = {
  register,
  login,
};
