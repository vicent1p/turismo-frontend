// Runtime API configuration injected before Angular bootstraps.
// En entorno local se conecta automáticamente a http://localhost:3000.
// En producción (Plesk/Nginx) se conecta al dominio público oficial.
if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  window.__PLATO_API_URL__ = window.location.origin;
}

