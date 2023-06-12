const { getAllByEstadosYUsuario, updateState, getAllClosedStateAndUser, create } = require("../../models/pedido.model");
const { checkOperario } = require("../../utils/middlewares.js");
const { HttpError } = require("../../utils/errores");

const router = require("express").Router();

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

// POST /api/pedidos
router.post("/", checkOperario, async (req, res) => {

  console.log(req.body)
  try {
    const [result] = await create(req.body);
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

module.exports = router;
