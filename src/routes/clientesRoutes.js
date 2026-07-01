import { Router } from "express";
import checkAuth from "../middleware/authMiddleware.js";
import {
    ingresarCliente,
    listadoClientes,
    listadoCliente,
    actualizarCliente,
    eliminarCliente
} from '../controllers/clientesController.js'

const router = Router()

router.post('/ingresar', checkAuth, ingresarCliente)
router.get('/listar-clientes', checkAuth, listadoClientes)
router.get('/listar-cliente/:id', checkAuth, listadoCliente)
router.put('/actualizar-cliente/:id', checkAuth, actualizarCliente)
router.delete('/eliminar-cliente/:id', checkAuth, eliminarCliente)

export default router