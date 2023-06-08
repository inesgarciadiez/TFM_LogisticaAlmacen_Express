const { getAllByEstadosYUsuario, updateCloseState } = require("../../models/pedido.model");
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

// GET /api/pedidos/operario/estado
router.put("/operario/:estado", checkOperario, async (req, res) => {

  console.log(req.params.estado)
  const estadoId = req.params.estado;
  try {
    const [result] = await updateCloseState(estadoId, req.body.referencia);
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
