import Admin from "../models/Admin.js";
import jwt from 'jsonwebtoken'

const checkAuth = async (req, res, next) => {
    console.log('Esta entrando a la verificacion')
    const token = req.cookies.token;

    if(!token) {
        return res.status(401).send({ message: 'Acceso denegado' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)

        req.admin = await Admin.findById(decoded.id)//Creamos la sesion con express
        console.log(req.admin)
        console.log('pasa la verificacion')
        return next();
    } catch (error) {
        const error1 = new Error('Token no valido');
        res.status(403).json({ msg: error1.message });
    }
    
    
    
     
    
    
}

export default checkAuth