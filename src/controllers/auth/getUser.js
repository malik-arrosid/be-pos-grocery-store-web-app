import pool from "../../database/db.js";

const getAllUser = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_user, username, role FROM users ORDER BY username ASC"
    );
    res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan semua user",
      data: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export default getAllUser;
