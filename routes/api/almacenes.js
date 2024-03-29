const router = require("express").Router();
const { getAllAlmacenes, create, updateAlmacen, getAlmacenByNombre } = require('../../models/almacen.model');
const { checkJefeEquipo, checkToken } = require("../../utils/middlewares");
const { HttpError } = require('../../utils/errores');


// GET /api/almacenes
router.get('/:nombre',checkToken, async(req, res) => {
    const { nombre } = req.params;

    try {
        const [result] = await getAlmacenByNombre(nombre);
        res.json(result);
        console.log(result)
    } catch (error) {
        res.status(503)
            .json({ fatal: error.message });
    }
});


// GET /api/almacenes/nombre
router.get('/',checkToken, async(req, res) => {
    try {
        const [result] = await getAllAlmacenes();
        res.json(result);
        console.log(result)
    } catch (error) {
        res.status(503)
            .json({ fatal: error.message });
    }
});

// POST /api/almacenes
router.post('/', checkToken, checkJefeEquipo, async(req, res) => {

if(
    req.body.nombre === '' ||
    req.body.responsable_id === '' ||
    req.body.direccion === '' ||
    req.body.ciudad === '' ||
    req.body.codigo_postal === ''
) { 
    const error = new HttpError(
        'El nombre, el responsable_id, el direccion, la ciudad y el código postal deben estar rellenos.',
        400
    );
    return res.status(error.codigoEstado).json(error);
}
try {
    const [result] = await create(req.body);
    console.log(result)
    res.json(result);
    } catch (error) {
        const errorMetodo = new HttpError(
            `Error en el POST: ${error.message}`,
            422
        );
        return res.status(errorMetodo.codigoEstado).json(errorMetodo);
    }
});

// PUT /api/almacenes/id
router.put('/:id',checkToken, checkJefeEquipo, async(req, res) => {
    const { id } = req.params;
if(
    req.body.nombre === '' ||
    req.body.responsable_id === '' ||
    req.body.direccion === '' ||
    req.body.ciudad === '' ||
    req.body.codigo_postal === ''
) { 
    const error = new HttpError(
        'El nombre, el responsable_id, el direccion, la ciudad y el código postal deben estar rellenos.',
        400
    );
    return res.status(error.codigoEstado).json(error);
}
try {
    const [result] = await updateAlmacen(req.body, id);
    res.json(result);
    } catch (error) {
        const errorMetodo = new HttpError(
            `Error en el POST: ${error.message}`,
            422
        );
        return res.status(errorMetodo.codigoEstado).json(errorMetodo);
    }
});

module.exports = router;