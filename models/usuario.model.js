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

const getAllByRol = (usuarioRolNombre) => {
  return db.query(
    `SELECT us.id, nombre, apellido, email, rol_id FROM usuarios AS us
    INNER JOIN roles AS rl ON us.rol_id = rl.id
        WHERE rl.rol = ?`,
    [usuarioRolNombre]
  );
};

const update = (usuarioId, { nombre, apellido }, rolId) => {
  return db.query(
    `UPDATE usuarios SET nombre = ?, apellido = ?, rol_id = ? WHERE id = ?`,
    [nombre, apellido, rolId, usuarioId]
  );
};

const create = ({ nombre, apellido, email }, passwordEncrip, rolId) => {
  return db.query(
    `INSERT INTO usuarios (nombre, apellido, email, contraseña, rol_id) values (?, ?, ?, ?, ?)`,
    [nombre, apellido, email, passwordEncrip, rolId]
  );
};

module.exports = {
  getById,
  getByEmail,
  getAll,
  getAllByRol,
  update,
  create,
};
