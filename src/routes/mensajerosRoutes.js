import { Router } from "express";
import checkAuth from "../middleware/authMiddleware.js";
import {
    ingresarMensajero,
    listadoMensajeros,
    listarMensajero,
    editarMensajero,
    eliminarMensajero
} from '../controllers/mensajerosController.js'

const router = Router()

router.post('/ingresar-mensajero', checkAuth, ingresarMensajero)
router.get('/listar-mensajeros', checkAuth, listadoMensajeros)
router.get('/listar-mensajero/:id', checkAuth, listarMensajero)
router.put('/editar-mensajero/:id', checkAuth, editarMensajero)
router.delete('/eliminar-mensajero/:id', checkAuth, eliminarMensajero)


export default router