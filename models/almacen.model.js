const getAllAlmacenes = () => {
  return db.query(`SELECT * FROM almacenes`);
};

function updateAlmacenes(usuarioId) {
  return db.query(
    `UPDATE almacenes SET responsable_id = null
      WHERE responsable_id = ?`,
    [usuarioId]
  );
}

const getAlmacenByNombre = (almacenNombre) => {
  return db.query(
    `SELECT id, nombre, responsable_id, direccion, ciudad, codigo_postal FROM almacenes WHERE nombre = ?`,
    [almacenNombre]
  );
};

const create = ({
  nombre,
  responsable_id,
  direccion,
  ciudad,
  codigo_postal,
}) => {
  return db.query(
    `INSERT INTO almacenes (nombre, responsable_id, direccion, ciudad, codigo_postal) values (?, ?, ?, ?, ?)`,
    [nombre, responsable_id, direccion, ciudad, codigo_postal]
  );
};

const updateAlmacen = (
  { nombre, responsable_id, direccion, ciudad, codigo_postal },
  id
) => {
  return db.query(
    `UPDATE almacenes SET nombre = ?, responsable_id = ?, direccion = ?, ciudad = ?, codigo_postal = ? WHERE id = ?`,
    [nombre, responsable_id, direccion, ciudad, codigo_postal, id]
  );
};

module.exports = {
  getAllAlmacenes,
  updateAlmacen,
  getAlmacenByNombre,
  updateAlmacenes,
  create,
};
