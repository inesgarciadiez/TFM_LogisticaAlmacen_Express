const router = require("express").Router();

const { getAllAlmacenes } = require('../../models/almacenes.model');


// GET /api/almacenes
router.get('/', async(req, res) => {

    console.log('Dentro de almacenes.js');
    try {
        const [result] = await getAllAlmacenes();
        res.json(result);
        console.log(result)
    } catch (error) {
        res.status(503)
            .json({ fatal: error.message });
    }
});

module.exports = router;