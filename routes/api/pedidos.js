const router = require("express").Router();
const { checkEncargado, checkToken } = require("../../utils/middlewares")
const {
  getAllByEstadosYUsuario,
  updateState,
  getAllClosedStateAndUser,
  getAllPedidos,
  update,
  create,
  updateEstadoYComentario,
  getAllPedidosByEncargado,
} = require('../../models/pedido.model');
const { checkOperario } = require('../../utils/middlewares.js');
const { HttpError } = require('../../utils/errores');
const { getById } = require('../../models/pedido.model');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { getAlmacenByNombre } = require('../../models/almacen.model');
const { getByEstado } = require('../../models/estado.model');

const estadosOperario = [
  'NUEVO',
  'ERROR',
  'LISTO_ENTRADA',
  'LISTO_SALIDA',
  'CERRADO',
];

const estadosEncargado = [
  'PTE-SALIDA',
  'PTE-ENTRADA',
];

const checkOperarioResponsable = async (pedido, usuarioId) => {
  // Si el estado del pedido es uno de los estados de operario y el responsable(operario) no es el usuario que hace la petición --> error.
  if (
    estadosOperario.includes(pedido.estado) &&
    pedido.responsable_id != usuarioId
  ) {
    return 'El pedido no está a cargo del usuario solicitante (OPERARIO)';
  }

  return null;
};

const checkEncargadoResponsable = async (pedido, usuarioId) => {
  // Si el estado del pedido es PTE_SALIDA, busco el responsable(encargado) del almacen_oriden del pedido. Si no es igual al usuario que hace la petición --> error.
  if (pedido.estado === 'PTE_SALIDA') {
    const [almacenOrigen] = await getAlmacenByNombre(pedido.almacen_origen);
    if (almacenOrigen[0].responsable_id != usuarioId) {
      return 'El pedido no está a cargo del usuario solicitante (ENCARGADO ORIGEN)';
    }
  }

  // Si el estado del pedido es PTE_ENTRADA, busco el responsable(encargado) del almacen_destino del pedido. Si no es igual al usuario que hace la petición --> error.
  if (pedido.estado === 'PTE_ENTRADA') {
    const [almacenDestino] = await getAlmacenByNombre(pedido.almacen_destino);
    if (almacenDestino[0].responsable_id != usuarioId) {
      return 'El pedido no está a cargo del usuario solicitante (ENCARGADO DESTINO)';
    }
  }

  return null;
};

const checkPedidoPermisos = async (pedido, usuarioId) => {
  let errorOperario = checkOperarioResponsable(pedido, usuarioId);
  if (errorOperario) {
    return errorOperario;
  }

  let errorEncargado = checkEncargadoResponsable(pedido, usuarioId);
  if (errorEncargado) {
    return errorEncargado;
  }

  return null;
};

/////////////////////////////
// GET /api/pedidos/operario
router.get('/operario', checkToken, checkOperario, async (req, res) => {
  const usuarioId = req.user.id;

  const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
  to: 'inesgarciadiezgd@gmail.com', // Change to your recipient
  from: 'inees9204.igd@gmail.com', // Change to your verified sender
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })
 
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

//////////////////// GET /api/pedidos/encargado
//
router.get('/encargado', checkToken, checkEncargado, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [result] = await getAllPedidosByEncargado(estadosEncargado, usuarioId);
    res.json(result);
    console.log(result);
  } catch (error) {
    res.status(503).json({ fatal: error.message });
  }
});

/////////////////////////////
// GET /api/pedidos/operario
router.get('/operario/:estado', checkOperario, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [result] = await getAllClosedStateAndUser(
      req.params.estado,
      usuarioId
    );
    res.json(result);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

/////////////////////////////
// PUT /api/pedidos/operario/enviorevision/pedidoId
router.put(
  '/operario/enviorevision/:pedidoId',
  checkOperario,
  async (req, res) => {
    const { pedidoId } = req.params;

    let pedido;

    try {
      const [pedidoById] = await getById(pedidoId);
      if (pedidoById.length === 0) {
        const error = new HttpError('No existe el pedido con ese Id', 404);
        return res.status(error.codigoEstado).json(error);
      }
      pedido = pedidoById[0];
    } catch (error) {
      const errorMetodo = new HttpError(
        `Error en el acceso de recuperar pedido: ${error.message}`,
        422
      );
      return res.status(errorMetodo.codigoEstado).json(errorMetodo);
    }

    // Compruebo que el usuario que realiza la petición puede modificar el estado del pedido (operario responsable)
    let mensajeError = await checkOperarioResponsable(pedido, req.user.id);
    if (mensajeError) {
      const error = new HttpError(mensajeError, 403);
      return res.status(error.codigoEstado).json(error);
    }

    //Si el estado es NUEVO o ERROR el pedido pasará a PTE_SALIDA.
    //Si el estado es LISTO_SALIDA el pedido pasará a PTE_ENTRADA
    try {
      let nuevoEstado;
      switch (pedido.estado) {
        case 'NUEVO':
        case 'ERROR':
          nuevoEstado = 'PTE_SALIDA';
          break;
        case 'LISTO_SALIDA':
          nuevoEstado = 'PTE_ENTRADA';
          break;
        default:
          const error = new HttpError(
            'El pedido no está listo para revisión',
            400
          );
          return res.status(error.codigoEstado).json(error);
      }

      const [result] = await updateState(nuevoEstado, pedidoId);
      const [pedidoById] = await getById(pedidoId);
      res.json(pedidoById[0]);
    } catch (error) {
      const errorMetodo = new HttpError(
        `Error al actualizar el estado: ${error.message}`,
        422
      );
      return res.status(errorMetodo.codigoEstado).json(errorMetodo);
    }
  }
);

/////////////////////////////
// PUT /api/pedidos/operario/cerrar/pedidoId
router.put('/operario/cerrar/:pedidoId', checkOperario, async (req, res) => {
  const { pedidoId } = req.params;

  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: 'inesgarciadiezgd@gmail.com', // Change to your recipient
      from: 'inees9204.igd@gmail.com', // Change to your verified sender
      subject: 'Sending with SendGrid is Fun',
      text: 'El pedido ' + pedidoId + ' se ha cerrado',
      html: '<strong>El pedido' + pedidoId + 'se ha cerrado</strong>',
    }
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  // Compruebo que el usuario que realiza la petición puede modificar el estado del pedido (operario responsable)
  let mensajeError = await checkOperarioResponsable(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  //Si el estado es LISTO_ENTRADA el pedido pasará a CERRADO
  try {
    console.log(pedido.estado);
    if (pedido.estado != 'LISTO_ENTRADA') {
      const error = new HttpError('El pedido no está listo para cerrarse', 400);
      return res.status(error.codigoEstado).json(error);
    }

    const nuevoEstado = 'CERRADO';

    const [result] = await updateState(nuevoEstado, pedidoId);
    const [pedidoById] = await getById(pedidoId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error al actualizar el estado: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

/////////////////////////////
// GET /api/pedidos/encargado
router.get('/encargado', checkEncargado, async (req, res) => {
  try {
    const [result] = await getAllPedidos();
    res.json(result);
    console.log(result);
  } catch (error) {
    res.status(503).json({ fatal: error.message });
  }
});

/////////////////////////////
// PUT /api/pedidos/encargado/aprobar/pedidoId
router.put('/encargado/aprobar/:pedidoId', checkEncargado, async (req, res) => {
  const { pedidoId } = req.params;

  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  // Si el estado del pedido es PTE_SALIDA y el usuario que hace la petición no es el responsable(encargado) del almacen_oriden del pedido --> error
  // Si el estado del pedido es PTE_ENTRADA y el usuario que hace la petición no es el responsable(encargado) del almacen_destino del pedido --> error
  let mensajeError = await checkEncargadoResponsable(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  //Si el estado es PTE_SALIDA el pedido pasará a LISTO_SALIDA
  //Si el estado es PTE_ENTRADA el pedido pasará a LISTO_ENTRADA
  try {
    let nuevoEstado;
    switch (pedido.estado) {
      case 'PTE_SALIDA':
        nuevoEstado = 'LISTO_SALIDA';
        break;
      case 'PTE_ENTRADA':
        nuevoEstado = 'LISTO_ENTRADA';
        break;
      default:
        const error = new HttpError(
          'El pedido no está listo para aprobarse',
          400
        );
        return res.status(error.codigoEstado).json(error);
    }

    const [result] = await updateState(nuevoEstado, pedidoId);
    const [pedidoById] = await getById(pedidoId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error al actualizar el estado: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

/////////////////////////////
// PUT /api/pedidos/encargado/denegar/pedidoId
router.put('/encargado/denegar/:pedidoId', checkEncargado, async (req, res) => {
  const { pedidoId } = req.params;

  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  //Compruebo la petición
  if (req.body.comentario_error === '') {
    const error = new HttpError(
      'Si quiere denegar el pedido, el comentario de error debe estar relleno',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  // Si el estado del pedido es PTE_SALIDA y el usuario que hace la petición no es el responsable(encargado) del almacen_oriden del pedido --> error
  // Si el estado del pedido es PTE_ENTRADA y el usuario que hace la petición no es el responsable(encargado) del almacen_destino del pedido --> error
  let mensajeError = await checkEncargadoResponsable(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  //Si el estado es PTE_SALIDA o PTE_ENTRADA el pedido pasará a ERROR
  try {
    let nuevoEstado;
    let comentarioError;
    switch (pedido.estado) {
      case 'PTE_SALIDA':
      case 'PTE_ENTRADA':
        nuevoEstado = 'ERROR';
        comentarioError = req.body.comentario_error;
        break;
      default:
        const error = new HttpError(
          'El pedido no está listo para denegarse',
          400
        );
        return res.status(error.codigoEstado).json(error);
    }

    const [result] = await updateEstadoYComentario(
      nuevoEstado,
      comentarioError,
      pedidoId
    );
    const [pedidoById] = await getById(pedidoId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error al actualizar el estado: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});


/////////////////////////////
// GET /api/pedidos/pedidoId
router.get('/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;

  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  let mensajeError = await checkPedidoPermisos(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  res.json(pedido);
});

/////////////////////////////
// PUT /api/pedidos/pedidoId
router.put('/:pedidoId', checkOperario, async (req, res) => {
  const { pedidoId } = req.params;

  //Compruebo la petición
  if (
    req.body.fecha_salida === '' ||
    req.body.matricula === '' ||
    req.body.detalles_carga === ''
  ) {
    const error = new HttpError(
      'La fecha de salida, la matricula y los detalles de carga deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  //Valido que la fecha tenga un formato correcto y ser válida
  const fecha_salida = req.body.fecha_salida;
  if (!dayjs(fecha_salida, 'YYYY-MM-DD', true).isValid()) {
    const error = new HttpError(
      'La fecha tiene que tener formato YYYY-MM-DD y ser una fecha válida',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  if (req.body.almacen_origen === '' || req.body.almacen_destino === '') {
    const error = new HttpError(
      'Los almacenes de origen y destino deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  // Compruebo que el pedido que se va a editar, existe
  let pedido;

  try {
    const [pedidoById] = await getById(pedidoId);
    if (pedidoById.length === 0) {
      const error = new HttpError('No existe el pedido con ese Id', 404);
      return res.status(error.codigoEstado).json(error);
    }
    pedido = pedidoById[0];
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar pedido: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  // Compruebo que el usuario que realiza la petición puede editar el pedido (operario responsable)
  let mensajeError = await checkOperarioResponsable(pedido, req.user.id);
  if (mensajeError) {
    const error = new HttpError(mensajeError, 403);
    return res.status(error.codigoEstado).json(error);
  }

  // Transformo los nombres de los almacenes que vienen en la petición en los id, para actualizar el pedido.
  let almacenOrigenId;
  let almacenDestinoId;
  try {
    const [almacenOrigen] = await getAlmacenByNombre(req.body.almacen_origen);
    if (almacenOrigen.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de origen no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenOrigenId = almacenOrigen[0].id;

    const [almacenDestino] = await getAlmacenByNombre(req.body.almacen_destino);
    if (almacenDestino.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de destino no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenDestinoId = almacenDestino[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar almacen: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  try {
    const [result] = await update(
      pedidoId,
      req.body,
      almacenOrigenId,
      almacenDestinoId
    );
    const [pedidoById] = await getById(pedidoId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

/////////////////////////////
// POST /api/pedidos
router.post('/', checkOperario, async (req, res) => {
  //Compruebo la petición
  if (
    req.body.fecha_salida === '' ||
    req.body.matricula === '' ||
    req.body.detalles_carga === ''
  ) {
    const error = new HttpError(
      'La fecha de salida, la matricula y los detalles de carga deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  //Valido que la fecha tenga un formato correcto y sea válida
  const fecha_salida = req.body.fecha_salida;
  if (!dayjs(fecha_salida, 'YYYY-MM-DD', true).isValid()) {
    const error = new HttpError(
      'La fecha tiene que tener formato YYYY-MM-DD y ser una fecha válida',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  if (req.body.almacen_origen === '' || req.body.almacen_destino === '') {
    const error = new HttpError(
      'Los almacenes de origen y destino deben estar rellenos',
      400
    );
    return res.status(error.codigoEstado).json(error);
  }

  // Transformo los nombres de los almacenes que vienen en la petición en los id, para dar de alta el pedido.
  let almacenOrigenId;
  let almacenDestinoId;
  try {
    const [almacenOrigen] = await getAlmacenByNombre(req.body.almacen_origen);
    if (almacenOrigen.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de origen no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenOrigenId = almacenOrigen[0].id;

    const [almacenDestino] = await getAlmacenByNombre(req.body.almacen_destino);
    if (almacenDestino.length === 0) {
      const error = new HttpError(
        'El nombre del almacén de destino no existe',
        404
      );
      return res.status(error.codigoEstado).json(error);
    }
    almacenDestinoId = almacenDestino[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar almacen: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  let estadoId;
  try {
    const estadoNuevo = 'NUEVO';
    const [estado] = await getByEstado(estadoNuevo);
    if (estado.length === 0) {
      const error = new HttpError('El nombre del estado no existe', 404);
      return res.status(error.codigoEstado).json(error);
    }
    estadoId = estado[0].id;
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el acceso de recuperar el estado: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }

  try {
    const responsableId = req.user.id;

    const [result] = await create(
      req.body,
      responsableId,
      almacenOrigenId,
      almacenDestinoId,
      estadoId
    );
    const [pedidoById] = await getById(result.insertId);
    res.json(pedidoById[0]);
  } catch (error) {
    const errorMetodo = new HttpError(
      `Error en el POST: ${error.message}`,
      422
    );
    return res.status(errorMetodo.codigoEstado).json(errorMetodo);
  }
});

module.exports = router;
