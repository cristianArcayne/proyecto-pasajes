import axios from "axios";

const api = axios.create({
  baseURL: window.location.hostname.includes("onrender.com")
    ? "https://proyecto-pasajes.onrender.com/api/"
    : "http://localhost:8000/api/",
});

// Rutas públicas que no deben llevar cabecera de autenticación
const publicPaths = [
  'rutas',
  'viajes-disponibles',
  'asientos-disponibles',
  'registrar-pasaje',
  'recuperar-pasaje-publico',
  'tipos-pasajero',
  'login',
  'recuperar-password',
  'reset-password'
];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access");
  const url = config.url || "";
  const isPublic = publicPaths.some(path => url.includes(path));

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la API devuelve 401 (no autorizado), limpiamos el token caducado para evitar bloqueos
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("admin_access");
    }
    return Promise.reject(error);
  }
);

export default api;