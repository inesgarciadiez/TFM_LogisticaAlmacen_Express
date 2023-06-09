const router = require("express").Router();
const { checkEncargado } = require("../../utils/middlewares")
const { getAllPedidos } = require('../../models/pedidos.model');
const { getAllByEstadosYUsuario, updateState, getAllClosedStateAndUser } = require("../../models/pedido.model");
const { checkOperario } = require("../../utils/middlewares.js");
const { HttpError } = require("../../utils/errores");
const { getById } = require('../../models/pedido.model');

const estadosOperario = [
  'NUEVO',
  'ERROR',
  'LISTO_ENTRADA',
  'LISTO_SALIDA',
  'CERRADO',
];

const checkPedidoPermisos = async (pedido, usuarioId) => {
  // Si el estado del pedido es uno de los estados de operario y el responsable(operario) no es el usuario que hace la petición --> error.
  if (
    estadosOperario.includes(pedido.estado) &&
    pedido.responsable_id != usuarioId
  ) {
    return 'El pedido no está a cargo del usuario solicitante (OPERARIO)';
  }

  // Si el estado del pedido es PTE_SALIDA, busco el responsable(encargado) del almacen_oriden del pedido. Si no es igual al usuario que hace la petición --> error.
  if (pedido.estado === 'PTE_SALIDA') {
    const [almacenOrigen] = await getAlmacenByNombre(pedido.almacen_origen);
    console.log(almacenOrigen);
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
router.get("/operario/:estado", checkOperario, async (req, res) => {

  const usuarioId = req.user.id;
  try {
    const [result] = await getAllClosedStateAndUser(req.params.estado, usuarioId);
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
router.put("/operario/:referencia/:estado", checkOperario, async (req, res) => {

  try {
    const [result] = await updateState(req.params.estado, req.params.referencia);
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
router.get('/encargado', checkEncargado, async(req, res) => {
  try {
      const [result] = await getAllPedidos();
      res.json(result);
      console.log(result)
  } catch (error) {
      res.status(503)
          .json({ fatal: error.message });
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

module.exports = router;
