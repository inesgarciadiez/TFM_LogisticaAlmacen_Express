const getByEstado = (estado) => {
  return db.query(
    `SELECT id, estado, descripcion FROM estados
    WHERE estado = ?`,
    [estado]
  );
};

module.exports = {
  getByEstado,
};
