import express from "express"
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

//Conexion a base de datos
import { conexionDB } from "./config/db.js"

//Rutas
import adminRoutes from './routes/adminRoutes.js'
import clientesRoutes from './routes/clientesRoutes.js'
import mensajerosRoute from './routes/mensajerosRoutes.js'
import domisRoutes from './routes/domisRoutes.js'
import cuadreRoutes from './routes/cuadreRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import cuadreMensajeroRoutes from './routes/cuadreMensajeroRoutes.js'


const app = express()
app.use(express.json())

//Middleware para las cookies
app.use(cookieParser())

dotenv.config()
conexionDB()

app.use(cors({
    origin: ['http://localhost:4000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}))

app.use('/api/admin', adminRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/mensajeros', mensajerosRoute)
app.use('/api/domis', domisRoutes)
app.use('/api/cuadre', cuadreRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/cuadre-mensajero', cuadreMensajeroRoutes)

const PORT = 4000

//Lanzar el servidor
app.listen(PORT, () => {
    console.log(`Conectado al puerto ${PORT}`)
})