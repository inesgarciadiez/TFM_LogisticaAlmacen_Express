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

module.exports = {
  getById, getByEmail
};
