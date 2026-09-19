import pool from "../../database/db.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "Field tidak boleh kosong" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id_user = uuidv4();

    const newUser = await pool.query(
      `INSERT INTO users (id_user, username, password, role) VALUES ($1, $2, $3, $4)`,
      [id_user, username, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: "User berhasil didaftarkan",
      data: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export default registerUser;
