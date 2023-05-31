const { checkToken } = require("../utils/middlewares.js");

const router = require('express').Router();

router.use('/almacenes', 
    require('./api/almacenes'));

module.exports = router;