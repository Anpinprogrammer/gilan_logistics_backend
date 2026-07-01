import { Router } from "express";
import { 
    ingresarAdmin,
    confirmar,
    perfil,
    logout 
} from "../controllers/adminController.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = Router()

router.post('/ingresar-admin', ingresarAdmin)
router.post('/login', confirmar)

//Rutas protegidas
router.get('/ruta-protegida', checkAuth, perfil)
router.post('/logout', checkAuth, logout)




export default router