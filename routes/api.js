const { checkToken } = require("../utils/middlewares.js");

const router = require('express').Router();

router.use('/almacenes',checkToken, require('./api/almacenes.js'));
router.use('/pedidos', checkToken, require('./api/pedidos.js'))

module.exports = router;