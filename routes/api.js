const { checkToken } = require("../utils/middlewares.js");

const router = require("express").Router();

router.use("/pedidos", checkToken, require("./api/pedidos.js"));

module.exports = router;