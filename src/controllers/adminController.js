import Admin from "../models/Admin.js"
import generarJWT from "../helpers/generarJWT.js"

export const ingresarAdmin = async (req, res) => {

    const { usuario } = req.body

    const existeUsuario = await Admin.findOne({usuario})

    if(existeUsuario){
        return res.status(404).json({ msg: 'Usuario existente, ingrese con sus credenciales' })
    }

    try {
        const admin = new Admin(req.body)
        const adminGuardado = await admin.save()
        return res.status(200).json({ msg: 'Admin creado con exito' })
    } catch (error) {
        return res.status(404).json({ msg: error })
    }
}

export const confirmar = async (req, res) => {
    const { usuario, password } = req.body;

    const admin = await Admin.findOne({usuario})

    if(!admin){
        return res.status(404).json({msg: 'Admin no existe, registrelo e intente de nuevo'})
    }

    if( await admin.comprobarPassword(password) ){
        const token = generarJWT(admin._id)
        admin.token = token
        const adminGuardado = await admin.save()

        //Establecer cookie 
        res.cookie('token', token, {
            httpOnly: true,      // No accesible por JavaScript
            secure: false,        // Solo se enviará a través de HTTPS
            maxAge: 3600000,     // 1 hora
        });

        

        res.json({
            _id: admin._id,
            nombre: admin.nombre,
            correo: admin.correo,
            usuario: admin.usuario,
            token: token,
        });
    } else {
        return res.status(404).json({msg: 'Contraseña Incorrecta'})
    }

}

export const perfil = (req, res) => {
    const { admin } = req
    res.json(admin)
}

export const logout = async (req, res) => {
    // Si usas express-session, destruye la sesión
    req.admin = null

   // Borra la cookie de sesión en el navegador
   res.clearCookie('token', {
       httpOnly: true,
       secure: false,
   }); // Asegúrate de poner el nombre correcto de la cookie
   res.status(200).send('Sesión cerrada');
   
 }