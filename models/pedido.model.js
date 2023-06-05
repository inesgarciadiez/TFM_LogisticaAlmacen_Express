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

module.exports = {
  getAllByEstadosYUsuario,
};
