const router = require("express").Router();
const { checkEncargado } = require("../../utils/middlewares")
const {
  getAllByEstadosYUsuario,
  updateState,
  getAllClosedStateAndUser,
  getAllPedidos,
  update,
  create,
} = require('../../models/pedido.model');
const { checkOperario } = require('../../utils/middlewares.js');
const { HttpError } = require('../../utils/errores');
const { getById } = require('../../models/pedido.model');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { getAlmacenByNombre } = require('../../models/almacen.model');
const { getByEstado } = require('../../models/estado.model');

const estadosOperario = [
  'NUEVO',
  'ERROR',
  'LISTO_ENTRADA',
  'LISTO_SALIDA',
  'CERRADO',
];

const checkOperarioResponsable = async (pedido, usuarioId) => {
  // Si el estado del pedido es uno de los estados de operario y el responsable(operario) no es el usuario que hace la petición --> error.
  if (
    estadosOperario.includes(pedido.estado) &&
    pedido.responsable_id != usuarioId
  ) {
    return 'El pedido no está a cargo del usuario solicitante (OPERARIO)';
  }

  return null;
};

const checkPedidoPermisos = async (pedido, usuarioId) => {
  // Si el estado del pedido es uno de los estados de operario y el responsable(operario) no es el usuario que hace la petición --> error.
  let errorOperario = checkOperarioResponsable(pedido, usuarioId);
  if (errorOperario) {
    return errorOperario;
  }

  // Si el estado del pedido es PTE_SALIDA, busco el responsable(encargado) del almacen_oriden del pedido. Si no es igual al usuario que hace la petición --> error.
  if (pedido.estado === 'PTE_SALIDA') {
    const [almacenOrigen] = await getAlmacenByNombre(pedido.almacen_origen);
    if (almacenOrigen[0].responsable_id != usuarioId) {
      return 'El pedido no está a cargo del usuario solicitante (ENCARGADO ORIGEN)';
    }
  }

  // Si el estado del pedido es PTE_ENTRADA, busco el responsable(encargado) del almacen_destino del pedido. Si no es igual al usuario que hace la petición --> error.
  if (pedido.estado === 'PTE_ENTRADA') {
    const [almacenDestino] = await getAlmacenByNombre(pedido.almacen_destino);
    if (almacenDestino[0].responsable_id != usuarioId) {
      return 'El pedido no está a cargo del usuario solicitante (ENCARGADO DESTINO)';
    }
  }

  return null;
};

// GET /api/pedidos/operario
router.get('/operario', checkOperario, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [result] = await getAllByEstadosYUsuario(estadosOperario, usuarioId);
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// GET /api/pedidos/operario
router.get('/operario/:estado', checkOperario, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [result] = await getAllClosedStateAndUser(
      req.params.estado,
      usuarioId
    );
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// PUT /api/pedidos/operario/referencia/estado
router.put('/operario/:referencia/:estado', checkOperario, async (req, res) => {
  try {
    const [result] = await updateState(
      req.params.estado,
      req.params.referencia
    );
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// GET /api/pedidos/encargado
router.get('/encargado', checkEncargado, async (req, res) => {
  try {
    const [result] = await getAllPedidos();
    res.json(result);
    console.log(result);
  } catch (error) {
    res.status(503).json({ fatal: error.message });
  }
});
// GET /api/pedidos/pedidoId
router.get('/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;

  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  let mensajeError = await checkPedidoPermisos(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  res.json(pedido);
});

// PUT /api/pedidos/pedidoId
router.put('/:pedidoId', checkOperario, async (req, res) => {
  const { pedidoId } = req.params;

  //Compruebo la petición
  if (
    req.body.fecha_salida === '' ||
    req.body.matricula === '' ||
    req.body.detalles_carga === ''
  ) {
    const error = new HttpError(
      'La fecha de salida, la matricula y los detalles de carga deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  //Valido que la fecha tenga un formato correcto y ser válida
  const fecha_salida = req.body.fecha_salida;
  if (!dayjs(fecha_salida, 'YYYY-MM-DD', true).isValid()) {
    const error = new HttpError(
      'La fecha tiene que tener formato YYYY-MM-DD y ser una fecha válida',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  if (req.body.almacen_origen === '' || req.body.almacen_destino === '') {
    const error = new HttpError(
      'Los almacenes de origen y destino deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  // Compruebo que el pedido que se va a editar, existe
  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  // Compruebo que el usuario que realiza la petición puede editar el pedido (operario responsable)
  let mensajeError = await checkOperarioResponsable(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  // Transformo los nombres de los almacenes que vienen en la petición en los id, para actualizar el pedido.
  let almacenOrigenId;
  let almacenDestinoId;
  try {
    const [almacenOrigen] = await getAlmacenByNombre(req.body.almacen_origen);
    if (almacenOrigen.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de origen no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenOrigenId = almacenOrigen[0].id;

    const [almacenDestino] = await getAlmacenByNombre(req.body.almacen_destino);
    if (almacenDestino.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de destino no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenDestinoId = almacenDestino[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar almacen: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  try {
    const [result] = await update(
      pedidoId,
      req.body,
      almacenOrigenId,
      almacenDestinoId
    );
    const [pedidoById] = await getById(pedidoId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

// POST /api/pedidos
router.post('/', checkOperario, async (req, res) => {
  //Compruebo la petición
  if (
    req.body.fecha_salida === '' ||
    req.body.matricula === '' ||
    req.body.detalles_carga === ''
  ) {
    const error = new HttpError(
      'La fecha de salida, la matricula y los detalles de carga deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  //Valido que la fecha tenga un formato correcto y sea válida
  const fecha_salida = req.body.fecha_salida;
  if (!dayjs(fecha_salida, 'YYYY-MM-DD', true).isValid()) {
    const error = new HttpError(
      'La fecha tiene que tener formato YYYY-MM-DD y ser una fecha válida',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  if (req.body.almacen_origen === '' || req.body.almacen_destino === '') {
    const error = new HttpError(
      'Los almacenes de origen y destino deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  // Transformo los nombres de los almacenes que vienen en la petición en los id, para dar de alta el pedido.
  let almacenOrigenId;
  let almacenDestinoId;
  try {
    const [almacenOrigen] = await getAlmacenByNombre(req.body.almacen_origen);
    if (almacenOrigen.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de origen no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenOrigenId = almacenOrigen[0].id;

    const [almacenDestino] = await getAlmacenByNombre(req.body.almacen_destino);
    if (almacenDestino.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de destino no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenDestinoId = almacenDestino[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar almacen: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  let estadoId;
  try {
    const estadoNuevo = 'NUEVO';
    const [estado] = await getByEstado(estadoNuevo);
    if (estado.length === 0) {
      const error = new HttpError('El nombre del estado no existe', 404);
      return res.status(error.codigoEstado).json(error);
    }
    estadoId = estado[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar el estado: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  try {
    const responsableId = req.user.id;

    const [result] = await create(
      req.body,
      responsableId,
      almacenOrigenId,
      almacenDestinoId,
      estadoId
    );
    const [pedidoById] = await getById(result.insertId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el POST: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

module.exports = router;
