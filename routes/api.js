const { checkToken } = require("../utils/middlewares.js");

const router = require("express").Router();

router.use("/pedidos", checkToken, require("./api/pedidos.js"));
router.use('/usuarios', require('./api/usuarios'));

module.exports = router;
