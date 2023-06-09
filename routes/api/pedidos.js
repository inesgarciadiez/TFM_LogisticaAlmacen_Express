const router = require("express").Router();
const { checkEncargado } = require("../../utils/middlewares")
const { getAllPedidos } = require('../../models/pedidos.model');
const { getAllByEstadosYUsuario, updateState, getAllClosedStateAndUser } = require("../../models/pedido.model");
const { checkOperario } = require("../../utils/middlewares.js");
const { HttpError } = require("../../utils/errores");

const estadosOperario = [
  "NUEVO",
  "ERROR",
  "LISTO_ENTRADA",
  "LISTO_SALIDA",
  "CERRADO",
];

// GET /api/pedidos/operario
router.get("/operario", checkOperario, async (req, res) => {
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

module.exports = router;
