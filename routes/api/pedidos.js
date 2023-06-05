const router = require("express").Router();
const { checkEncargado } = require("../../utils/middlewares")

const { getAllPedidos } = require('../../models/pedidos.model');


// GET /api/pedidos
router.get('/encargado', async(req, res) => {
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