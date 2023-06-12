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
    `UPDATE pedidos SET estado_id = ? WHERE id = ?`,
    [estado, pedidoId]
  );
};

const create = ({ fecha_salida, almacen_origen, almacen_destino, matricula, detalle }) => {
  return db.query(
    `INSERT INTO pedidos (fecha_salida, almacen_origen_id, almacen_destino_id, matricula, detalles) values (?, ?, ?, ?, ?)`,
    [fecha_salida, almacen_origen, almacen_destino, matricula, detalle]
  );
};


module.exports = {
  getAllByEstadosYUsuario, updateState, getAllClosedStateAndUser,create
};
