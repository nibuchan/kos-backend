require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require('./routes/authRoutes');
const kosRoutes = require("./routes/kosRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/kos", kosRoutes);

app.get("/", (req, res) => {
  res.send("API kos-kosan sudah berjalan!");
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
