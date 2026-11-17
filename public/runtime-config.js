// Runtime API configuration injected before Angular bootstraps.
// En entorno local se conecta automáticamente a http://localhost:3000.
// En producción se conecta a la API oficial.
if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  window.__PLATO_API_URL__ = 'https://proturismoapi.magdalena.gov.co';
}

