import Mensajero from "../models/Mensajero.js"

const ingresarMensajero = async (req, res) => {

    const { cedula } = req.body

    const existeMensajero = await Mensajero.findOne({cedula})

    if(existeMensajero){
        return res.status(404).json({ msg: 'El mensajero ya existe' })
    }

    try {
        const nuevoMensajero = new Mensajero(req.body)
        const mensajeroGuardado = await nuevoMensajero.save()
        return res.status(202).json({ msg: 'Mensajero Guardado' })
    } catch (error) {
        console.log(error)
    }
}

const listadoMensajeros = async (req, res) => {
    const mensajeros = await Mensajero.find();
    return res.status(200).json(mensajeros)
}

const listarMensajero = async (req, res) => {
    const { id } = req.params

    try {
        const mensajero  = await Mensajero.findById(id)
        return res.json(mensajero)
    } catch (error) {
        console.log(error)
    }
}

const editarMensajero = async (req, res) => {
    const { id } = req.params
    const { nombres, cedula, telefono, usuario, password } = req.body

    try {
        const mensajero = await Mensajero.findById(id)
        mensajero.nombres = nombres || mensajero.nombres;
        mensajero.cedula = cedula || mensajero.cedula;
        mensajero.telefono = telefono || mensajero.telefono;
        mensajero.usuario = usuario || mensajero.usuario;
        mensajero.password = password || mensajero.password;
        const mensajeroGuardado = await mensajero.save()
        return res.status(202).json({ msg: 'Mensajero actualizado satisfactoriamente' })
    } catch (error) {
        console.log(error)
    }
}

const eliminarMensajero = async (req, res) => {
    const { id } = req.params

    const existemeMensajero = await Mensajero.findById(id)

    if(existemeMensajero){
        try {
            const mensajeroEliminado = await existemeMensajero.deleteOne()
            return res.status(202).json({ msg: 'Mensajero Elminmado Con Exito' })            
        } catch (error) {
            console.log(error)
        }
    }
}


export {
    ingresarMensajero,
    listadoMensajeros,
    listarMensajero,
    editarMensajero,
    eliminarMensajero
}