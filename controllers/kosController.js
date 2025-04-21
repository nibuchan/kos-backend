const db = require("../utils/db");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

const createKos = async (req, res) => {
  const { nama, alamat, fasilitas, harga, latitude, longitude } = req.body;
  const userId = req.user.id;

  const parseToPgArray = (arr) => {
    if (!arr) return "{}";
    if (typeof arr === "string") {
      try {
        const parsed = JSON.parse(arr);
        return `{${parsed.map(item => `"${item}"`).join(",")}}`;
      } catch (e) {
        return `{${arr}}`;
      }
    }
    if (Array.isArray(arr)) {
      return `{${arr.map(item => `"${item}"`).join(",")}}`;
    }
    return "{}";
  };

  try {
    const uploadToCloudinary = (file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "kos" },
          (error, result) => {
            if (result) resolve(result.secure_url);
            else reject(error)
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

    const fotoFiles = req.files;
    const urls = await Promise.all(fotoFiles.map(uploadToCloudinary));

    const fasilitasPgArray = parseToPgArray(fasilitas);

    const getCoordinates = async (alamat) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(alamat)}`, {
      headers: {
        'User-Agent': 'BaCariKos/1.0 (admin@email.com)'
      }
    });
      const data = await response.json();
      console.log("Nominatim response:", data);

      if (data.length === 0) return { lat: null, lon: null };
      
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    };

    const { lat, lon } = await getCoordinates(alamat);

    const result = await db.query(
      `INSERT INTO kos (nama, alamat, fasilitas, harga, foto_url, latitude, longitude, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [nama, alamat, fasilitasPgArray, harga, JSON.stringify(urls), lat, lon, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error di createKos:", err);
    res.status(500).json({ error: "Gagal menambahkan data kos" });
  }
};

const getAllKos = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM kos ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data kos" });
  }
};

const getKosById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM kos WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Kos tidak ada" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data kos" });
  }
};

const updateKos = async (req, res) => {
  const { id } = req.params;
  const { nama, alamat, fasilitas, harga, foto_url, latitude, longitude } =
    req.body;

  try {
    const result = await db.query(
      `UPDATE kos
      SET nama = $1, alamat = $2, fasilitas = $3, harga = $4,
      foto_url = $5, latitude = $6, longitude = $7
      WHERE id = $8
      RETURNING *`,
      [nama, alamat, fasilitas, harga, foto_url, latitude, longitude, id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Kos tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate data kos" });
  }
};

const deleteKos = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM kos WHERE id = $1 RETURNING *", [
      id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Kos tidak ditemukan" });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus data kos" });
  }
};

module.exports = {
  createKos,
  getAllKos,
  getKosById,
  updateKos,
  deleteKos,
};
