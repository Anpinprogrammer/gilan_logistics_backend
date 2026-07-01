import { Router } from "express";
import checkAuth from "../middleware/authMiddleware.js";
import {
    ingresarCuadre,
    listarCuadre,
    obtenerResumenClientes,
    obtenerResumenMensajeros,
    obtenerClientesPendientes,
    registrarCuadreCliente,
    obtenerHistorialCuadres
} from '../controllers/cuadreController.js'

const router = Router()

router.post('/ingresar', checkAuth, ingresarCuadre)
router.get('/listar', checkAuth, listarCuadre)
router.get('/resumen-clientes', checkAuth, obtenerResumenClientes)
router.get('/resumen-mensajeros', checkAuth, obtenerResumenMensajeros)
router.get('/pendientes-clientes', checkAuth, obtenerClientesPendientes)
router.post('/registrar-cuadre-cliente', checkAuth, registrarCuadreCliente)
router.get('/historial-cuadres', checkAuth, obtenerHistorialCuadres)

export default router