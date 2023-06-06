const getById = (usuarioId) => {
  return db.query(
    `SELECT us.id, us.nombre, us.apellido, us.email, rl.rol FROM usuarios AS us 
  INNER JOIN roles AS rl ON us.rol_id = rl.id
  WHERE us.id = ?`,
    [usuarioId]
  );
};

const getByEmail = (email) => {
  return db.query(
      'select * from usuarios where email = ?',
      [email]
  );
}

const getAll = () => {
  return db.query(`SELECT us.id, us.nombre, us.apellido, us.email, rl.rol FROM usuarios AS us 
    INNER JOIN roles AS rl ON us.rol_id = rl.id`);
};

const getAllByRol = (usuarioViejoRol) => {
  return db.query(
    `SELECT id, nombre, apellido FROM usuarios
    WHERE rol_id = ?`,
    [usuarioViejoRol]
  );
};

const update = (usuarioId, { nombre, apellido }, rolId) => {
  return db.query(
    `UPDATE usuarios SET nombre = ?, apellido = ?, rol_id = ? WHERE id = ?`,
    [nombre, apellido, rolId, usuarioId]
  );
};

module.exports = {
  getById,
  getByEmail,
  getAll,
  getAllByRol,
  update,
};
