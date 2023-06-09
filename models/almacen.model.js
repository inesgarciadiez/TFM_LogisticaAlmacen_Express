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

const getAlmacenByNombre = (almacenDestino) => {
  return db.query(
    `SELECT nombre, responsable_id, direccion, ciudad, codigo_postal FROM almacenes WHERE nombre = ?`,
    [almacenDestino]
  );
};

module.exports = {
  getAllAlmacenes,
  update,
  getAlmacenByNombre,
};
