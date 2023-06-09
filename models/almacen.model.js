const getAllAlmacenes = () => {
  return db.query(`SELECT * FROM almacenes`);
};

/* function update(usuarioId) {
  return db.query(
    `UPDATE almacenes SET responsable_id = null
      WHERE responsable_id = ?`,
    [usuarioId]
  );
} */

const getAlmacenByNombre = (almacenDestino) => {
  return db.query(
    `SELECT nombre, responsable_id, direccion, ciudad, codigo_postal FROM almacenes WHERE nombre = ?`,
    [almacenDestino]
  );
};

const create = ({nombre, responsable_id, direccion, ciudad, codigo_postal}) => {
  return db.query(
    `INSERT INTO almacenes (nombre, responsable_id, direccion, ciudad, codigo_postal) values (?, ?, ?, ?, ?)`,
    [nombre, responsable_id, direccion, ciudad, codigo_postal]
  );
};

const updateAlmacen = (id, {nombre, responsable_id, direccion, ciudad, codigo_postal}) => {
  return db.query(
    `UPDATE almacenes SET nombre = ?, responsable_id = ?, direccion = ?, ciudad = ?, codigo_postal = 0 WHERE id = ?`,
    [nombre, responsable_id, direccion, ciudad, codigo_postal, id]
  );
};

module.exports = {
  getAllAlmacenes,
  updateAlmacen,
  getAlmacenByNombre,
  create,
};
