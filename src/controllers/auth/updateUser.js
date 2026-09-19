import pool from "../../database/db.js";
import bcrypt from "bcrypt";

const updateUserById = async (req, res) => {
  const { id_user } = req.params;
  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json({ message: "Minimal satu field harus diisi" });
  }

  try {
    const existingUser = await pool.query(
      `SELECT * FROM users WHERE id_user = $1`,
      [id_user]
    );
    if (existingUser.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const updateFields = [];
    const values = [];

    if (username) {
      updateFields.push(`username = $${updateFields.length + 1}`);
      values.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${updateFields.length + 1}`);
      values.push(hashedPassword);
    }

    values.push(id_user);
    const query = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id_user = $${values.length}`;
    await pool.query(query, values);

    const updatedUser = await pool.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id_user = $${
        values.length
      } RETURNING *`,
      values
    );

    res.status(200).json({
      success: true,
      message: "User berhasil diperbarui",
      data: updatedUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export default updateUserById;
