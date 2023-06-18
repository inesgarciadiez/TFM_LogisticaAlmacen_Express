const getAllByEstadosYUsuario = (estadosOperario, usuarioId) => {
  return db.query(
    `SELECT pe.id as referencia, fecha_salida, matricula, al.nombre as almacen_origen, al2.nombre as almacen_destino, es.estado FROM Logistica_Almacen.pedidos AS pe
    INNER JOIN Logistica_Almacen.almacenes AS al ON pe.almacen_origen_id = al.id
    INNER JOIN Logistica_Almacen.almacenes AS al2 ON pe.almacen_destino_id = al2.id
    INNER JOIN Logistica_Almacen.estados AS es ON pe.estado_id = es.id
    WHERE es.estado IN(?)
    AND pe.responsable_id = ?
    ORDER BY pe.id ASC`,
    [estadosOperario, usuarioId]
  );
};

const getAllPedidosByEncargado = (usuarioId) => {
  return db.query(`SELECT pe.id as referencia, estado_id, fecha_creacion, fecha_salida, matricula, detalles, alo.nombre as almacen_origen, ald.nombre as almacen_destino, es.estado FROM pedidos AS pe
  INNER JOIN almacenes AS alo ON pe.almacen_origen_id = alo.id
  INNER JOIN almacenes AS ald ON pe.almacen_destino_id = ald.id
  INNER JOIN estados AS es ON pe.estado_id = es.id
  WHERE estado = 'PTE_SALIDA' 
  OR estado = 'PTE_ENTRADA'
  ORDER BY pe.id ASC`,
  [usuarioId]
  );
};

/* OR estado = 'PTE_ENTRADA' AND pe.responsable_id = ? */

const getAllClosedStateAndUser = (estadosOperario, usuarioId) => {
  return db.query(
    `SELECT pe.id as referencia, fecha_salida, matricula, al.nombre as almacen_origen, al2.nombre as almacen_destino, es.estado FROM Logistica_Almacen.pedidos AS pe
    INNER JOIN Logistica_Almacen.almacenes AS al ON pe.almacen_origen_id = al.id
    INNER JOIN Logistica_Almacen.almacenes AS al2 ON pe.almacen_destino_id = al2.id
    INNER JOIN Logistica_Almacen.estados AS es ON pe.estado_id = es.id
    WHERE estado_id = ?
    AND pe.responsable_id = ?
    ORDER BY pe.id ASC`,
    [estadosOperario, usuarioId]
  );
};

const updateState = (estado, pedidoId ) => {
  console.log(estado + " - " + pedidoId)
  return db.query(
    `UPDATE pedidos SET estado_id = (SELECT id FROM estados WHERE estado = ?) , comentario_error = null WHERE id = ?`,
    [estado, pedidoId]
  );
};

const getById = (pedidoId) => {
  return db.query(
    `SELECT pe.id AS referencia, fecha_creacion, fecha_salida, matricula, detalles, comentario_error, pe.responsable_id, al.nombre AS almacen_origen, al2.nombre AS almacen_destino, es.estado FROM pedidos AS pe
    INNER JOIN almacenes AS al ON pe.almacen_origen_id = al.id
    INNER JOIN almacenes AS al2 ON pe.almacen_destino_id = al2.id
    INNER JOIN estados AS es ON pe.estado_id = es.id  
  WHERE pe.id = ?
  ORDER BY fecha_creacion ASC`,
    [pedidoId]
  );
};

const getAllPedidos = () => {
  return db.query(`SELECT * FROM pedidos`);
};
const update = (
  pedidoId,
  { fecha_salida, matricula, detalles_carga },
  almacen_origen_id,
  almacen_destino_id
) => {
  return db.query(
    `UPDATE pedidos SET fecha_salida = ?, matricula = ?, detalles = ?, almacen_origen_id = ?, almacen_destino_id = ? WHERE id = ?`,
    [
      fecha_salida,
      matricula,
      detalles_carga,
      almacen_origen_id,
      almacen_destino_id,
      pedidoId,
    ]
  );
};

const updateEstadoYComentario = (estado, comentarioError, pedidoId) => {
  return db.query(
    `UPDATE pedidos SET estado_id = (SELECT id FROM estados WHERE estado = ?) , comentario_error = ? WHERE id = ?`,
    [estado, comentarioError, pedidoId]
  );
};

const create = (
  { fecha_salida, matricula, detalles_carga },
  responsableId,
  almacenOrigenId,
  almacenDestinoId,
  estadoId
) => {
  return db.query(
    `INSERT INTO pedidos (fecha_creacion, fecha_salida, matricula, detalles, comentario_error, responsable_id, almacen_origen_id, almacen_destino_id, estado_id) values (now(), ?, ?, ?, null, ?, ?, ?, ?)`,
    [
      fecha_salida,
      matricula,
      detalles_carga,
      responsableId,
      almacenOrigenId,
      almacenDestinoId,
      estadoId,
    ]
  );
};

module.exports = {
  getAllByEstadosYUsuario, updateState, getAllClosedStateAndUser,
  getById, getAllPedidosByEncargado, create, update, getAllPedidos, updateEstadoYComentario
};
