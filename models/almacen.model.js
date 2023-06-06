const getAllAlmacenes = () => {
  return db.query(`SELECT * FROM almacenes`);
};

const update = (usuarioId) => {
  return db.query(
    `UPDATE almacenes SET responsable_id = null
      WHERE responsable_id = ?`,
    [usuarioId]
  );
};

module.exports = {
  getAllAlmacenes,
  update,
};
