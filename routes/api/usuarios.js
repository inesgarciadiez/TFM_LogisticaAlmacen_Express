const router = require('express').Router();
const bcrypt = require('bcryptjs');

const {
  getByEmail,
  getAll,
  getById,
  getAllByRol,
  update,
  create,
} = require('../../models/usuario.model');
const { createToken } = require('../../utils/helpers');
const { checkToken, checkJefeEquipo } = require('../../utils/middlewares');
const { HttpError } = require('../../utils/errores');
const { getAllByEstadosYUsuario } = require('../../models/pedido.model');
const { update: updateAlmacenes } = require('../../models/almacen.model');
const { getByRol } = require('../../models/rol.model');

const estadosActivosOperario = [
  'NUEVO',
  'ERROR',
  'LISTO_ENTRADA',
  'LISTO_SALIDA',
];

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

  try {
    const [usuarioById] = await getById(usuarioId);
    if (usuarioById.length === 0) {
      const error = new HttpError('No existe el usuario con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    res.json(usuarioById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar usuario: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// PUT /api/usuarios/usuarioId
router.put('/:usuarioId', checkToken, checkJefeEquipo, async (req, res) => {
  const { usuarioId } = req.params;

  //Compruebo la petición
  if (req.body.nombre === '' || req.body.apellido === '') {
    const error = new HttpError(
      'El nombre y el apellido deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  let rolId;
  try {
    const [rol] = await getByRol(req.body.rol);
    if (rol.length === 0) {
      const error = new HttpError(
        'El rol debe ser un rol registrado en la tabla de roles',
        400
      );
      return res.status(error.codigoEstado).json(error);
    }
    rolId = rol[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso al recuperar el rol de la petición: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  try {
    // Recupero el rol viejo del usuario
    let [usuarioById] = await getById(usuarioId);
    const usuarioRolViejo = usuarioById[0].rol;

    // si es distinto rol viejo y rol nuevo:
    if (usuarioRolViejo != req.body.rol) {
      // si deja de ser operario --> verificar que no tiene pedidos activos. Si tiene, dar error.
      try {
        if (usuarioRolViejo === 'operario') {
          const [pedidosActivos] = await getAllByEstadosYUsuario(
            estadosActivosOperario,
            usuarioId
          );
          if (pedidosActivos.length != 0) {
            const error = new HttpError(
              'El usuario no puede cambiar de rol porque tiene pedidos activos',
              409
            );
            return res.status(error.codigoEstado).json(error);
          }
        }
      } catch (error) {
        const errorMetodo = new HttpError(
          `Error en el acceso al recuperar los pedidos activos: ${error.message}`,
          422
        );
        return res.status(errorMetodo.codigoEstado).json(errorMetodo);
      }

      // si deja de ser jefe de equipo --> verificar que hay más jefes de equipo --> si es el único, dar error.
      if (usuarioRolViejo === 'jefe de equipo') {
        try {
          const [usuariosJefe] = await getAllByRol(usuarioRolViejo);
          if ((usuariosJefe.length = 1)) {
            const error = new HttpError(
              'El usuario no puede cambiar de rol porque es el único jefe de equipo',
              409
            );
            return res.status(error.codigoEstado).json(error);
          }
        } catch (error) {
          const errorMetodo = new HttpError(
            `Error en el acceso para comprobar si hay más jefes de equipo: ${error.message}`,
            422
          );
          return res.status(errorMetodo.codigoEstado).json(errorMetodo);
        }
      }

      // si deja de ser encargado --> se pone a nulo el responsable_id de los almacenes que tenga asignados
      // sigue con la actualización del rol y el front enviará un mensaje para que se reasignen los almacenes
      if (usuarioRolViejo === 'encargado') {
        try {
          await updateAlmacenes(usuarioId);
        } catch (error) {
          const errorMetodo = new HttpError(
            `Error en el acceso para actualizar almacenes: ${error.message}`,
            422
          );
          return res.status(errorMetodo.codigoEstado).json(errorMetodo);
        }
      }
    }

    // si el rol no es distinto al antiguo
    // o no hay errores
    const [result] = await update(usuarioId, req.body, rolId);
    [usuarioById] = await getById(usuarioId);
    res.json(usuarioById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// POST /api/usuarios
router.post('/', async (req, res) => {
  //Compruebo la petición
  if (
    req.body.nombre === '' ||
    req.body.apellido === '' ||
    req.body.email === '' ||
    req.body.password === ''
  ) {
    const error = new HttpError(
      'El nombre, el apellido, el email y la contraseña deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  let rolId;
  try {
    const [rol] = await getByRol(req.body.rol);
    if (rol.length === 0) {
      const error = new HttpError(
        'El rol debe ser un rol registrado en la tabla de roles',
        400
      );
      return res.status(error.codigoEstado).json(error);
    }
    rolId = rol[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso al recuperar el rol de la petición: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  //Encripto la contraseña
  const passwordEncrip = bcrypt.hashSync(req.body.password, 8);

  try {
    const [result] = await create(req.body, passwordEncrip, rolId);
    const [usuarioById] = await getById(result.insertId);
    res.json(usuarioById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el POST: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});


module.exports = router;