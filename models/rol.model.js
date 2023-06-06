const getByRol = (rol) => {
  return db.query(
    `SELECT * FROM roles AS us 
    WHERE rol = ?`,
    [rol]
  );
};

module.exports = {
  getByRol,
};
