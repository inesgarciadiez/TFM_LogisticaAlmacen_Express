const router = require('express').Router();
const bcrypt = require('bcryptjs');

const { getByEmail, getAll, getById } = require('../../models/usuario.model');
const { createToken } = require('../../utils/helpers');
const { checkToken, checkJefeEquipo } = require('../../utils/middlewares');
const { HttpError } = require('../../utils/errores');

router.post('/login', async (req, res) => {
  // ¿Existe el email en la base de datos?
  const [users] = await getByEmail(req.body.email);

  if (users.length === 0) {
    return res.json({ fatal: 'Error en email y/o contraseña' });
  }

  // Recuperamos el usuario
  const user = users[0];

  console.log(req.body.password, user.contraseña);
  // ¿Coinciden las password?
  const iguales = bcrypt.compareSync(req.body.password, user.contraseña);
  if (!iguales) {
    return res.json({ fatal: 'Error en email y/o contraseña' });
  }

  res.json({
    success: 'Login correcto',
    token: createToken(user),
  });
});

// GET /api/usuarios
router.get('/', checkToken, checkJefeEquipo, async (req, res) => {
  try {
    const [result] = await getAll();
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// GET /api/usuarios/usuarioId
router.get('/:usuarioId', checkToken, checkJefeEquipo, async (req, res) => {
  const { usuarioId } = req.params;
  console.log(usuarioId);
  try {
    const [usuarioById] = await getById(usuarioId);
    if (usuarioById.length === 0) {
      const error = new HttpError('No existe el usuario con ese Id', 403);
      return res.status(error.codigoEstado).json(error);
    }
    res.json(usuarioById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

module.exports = router;