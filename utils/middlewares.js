const jwt = require('jsonwebtoken');
const { getAllAlmacenes } = require('../models/almacenes.model');
const { HttpError } = require("./errores");



const checkToken = async (req, res, next) => {
    if (!req.headers['authorization']) {
      return res.json({ fatal: 'Debes incluir la cabecera de Autorización' });
  }

  const token = req.headers["authorization"];
  let obj;
  try {
    obj = jwt.verify(token, 'en un lugar de la mancha');
  } catch (error) {
    const errorToken = new HttpError(
      `Error en el token: ${error.message}`,
      401
    );
    return res.status(errorToken.codigoEstado).json(errorToken);
  }

  const [users] = await getAllAlmacenes(obj.usuario_id);
  req.user = users[0];

  next();
};

module.exports = checkToken;