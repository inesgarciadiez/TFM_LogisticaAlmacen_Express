class HttpError {
    constructor(mensaje, codigoEstado) {
      this.mensaje = mensaje;
      this.codigoEstado = codigoEstado;
    }
  }
  
  module.exports = {
    HttpError,
  };