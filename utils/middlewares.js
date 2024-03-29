const jwt = require("jsonwebtoken");
const { getById } = require("../models/usuario.model");
const { HttpError } = require("./errores");

const checkToken = async (req, res, next) => {
  if (!req.headers['authorization']) {
    const error = new HttpError(
      'Debes incluir la cabecera de autorización',
      401
    );
    return res.status(error.codigoEstado).json(error);
  }

  const token = req.headers['authorization'];
  let obj;
  try {
    obj = jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    const errorToken = new HttpError(
      `Error en el token: ${error.message}`,
      401
    );
    return res.status(errorToken.codigoEstado).json(errorToken);
  }

  const [users] = await getById(obj.usuario_id);
  req.user = users[0];

  next();
};

const checkEncargado = (req, res, next) => {
  if (req.user.rol != "encargado") {
    const error = new HttpError("Debes ser usuario encargado", 403);
    return res.status(error.codigoEstado).json(error);
  }
  next();
};

const checkOperario = (req, res, next) => {
  if (req.user.rol != 'operario') {
    const error = new HttpError('Debes ser usuario operario', 403);
    return res.status(error.codigoEstado).json(error);
  }
  next();
};

const checkJefeEquipo = (req, res, next) => {
  if (req.user.rol != 'jefe de equipo') {
    const error = new HttpError('Debes ser jefe de equipo', 403);
    return res.status(error.codigoEstado).json(error);
  }
  next();
};

module.exports = { checkToken, checkOperario, checkJefeEquipo, checkEncargado };
