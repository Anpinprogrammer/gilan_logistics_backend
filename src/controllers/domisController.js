import Cliente from "../models/Cliente.js";
import Mensajero from "../models/Mensajero.js";
import Domis from "../models/Domis.js";
import { rutaMap } from "../helpers/domicilios.js";

const ingresarDomi = async (req, res) => {
    const { cliente, ruta, nombres, empresa, direccionCli, telefonoCli, noDomi, mensajero, valorDomi, pagoMensajero, fecha, nombreEntrega, direccion, telefono, notas} = req.body

    try {
        const courier = await Mensajero.findById(mensajero)
        if(courier){
            // 2. Extraer los valores actuales del objeto 'courier'
        const { 
            totalDomis, 
            totalDomisPendientes, 
            totalGanancia, 
            diferencia 
        } = courier;

        const mensajeroActualizado = await Mensajero.findByIdAndUpdate(
            mensajero,
            {
                $set: {
                    totalDomis: (totalDomis || 0) + 1,
                    totalDomisPendientes: (totalDomisPendientes || 0) + 1,
                    totalGanancia: (totalGanancia || 0) + Number(pagoMensajero),
                    diferencia: (diferencia || 0) - Number(pagoMensajero)
                },
                $addToSet: { domicilios: noDomi }
            },
            {new: true}
        )
        } else {
            console.log('No se encontro courier')
        }

    } catch (error) {
        console.log(error)
    }

    if(cliente){
        try {
            const nuevoDomi = new Domis(req.body)
            nuevoDomi.ruta = rutaMap[ruta]
            const domiGuardado = await nuevoDomi.save()
            return res.status(202).json({ msg: 'Domi Creado con Exito' }) 
        } catch (error) {
            console.log(error)
        }
    } else {
        try {
            const nuevoCliente = new Cliente({ nombres, direccion: direccionCli, empresa, telefono: telefonoCli  })
            const guardarCliente = await nuevoCliente.save()
            const nuevoDomi = new Domis({
                noDomi,
                cliente: guardarCliente._id,
                mensajero,
                valorDomi,
                pagoMensajero,
                ruta: rutaMap[ruta],
                fecha,
                nombreEntrega,
                direccion,
                telefono,
                notas
            })
            const guardarNuevoDomi = await nuevoDomi.save()
            return res.status(202).json({ msg: 'Cliente y Domi creados con exito' })
        } catch (error) {
            console.log(error)
        }
    }
}

const listarDomis = async (req, res) => {
    const domis = await Domis.find()
        .populate('cliente', 'nombres empresa direccion telefono identificacion')
        .populate('mensajero', 'nombres cedula telefono usuario')
    return res.status(200).json(domis)
}

const actualizarEstadoDomi = async (req, res) => {
    const { id } = req.params
    const { estado } = req.body

    try {
        const domi = await Domis.findById(id)
        domi.estado = estado || domi.estado
        await domi.save()
        return res.status(200).json({ msg: 'Estado actualizado correctamente' })
    } catch (error) {
        console.log(error)
    }
    
}

const actualizarDomi = async (req, res) => {
    const { id } = req.params
    const { cliente, mensajero, valorDomi, pagoMensajero, ruta, fecha, nombreEntrega, direccion, telefono, notas } = req.body

    try {
        const domi = await Domis.findById(id)
        domi.cliente = cliente || domi.cliente;
        domi.mensajero = mensajero || domi.mensajero;
        domi.valorDomi = valorDomi || domi.valorDomi;
        domi.pagoMensajero = pagoMensajero || domi.pagoMensajero;
        domi.ruta = rutaMap[ruta] || domi.ruta;
        domi.fecha = fecha || domi.fecha;
        domi.nombreEntrega = nombreEntrega || domi.nombreEntrega;
        domi.direccion = direccion || domi.direccion;
        domi.telefono = telefono || domi.telefono;
        domi.notas = notas || domi.notas;
        const domiActualizado = await domi.save()
        return res.status(202).json({ msg: 'Domi Actulizado Correctamente' })
    } catch (error) {
        console.log(error)
    }
}

const buscarDomi = async (req, res) => {
    const { id } = req.params


    try {
        const domi = await Domis.findById(id)
        const mensajero = await Mensajero.findById(domi.mensajero)
        const cliente = await Cliente.findById(domi.cliente)
        return res.status(202).json({ valor: domi.valorDomi, mensajero: mensajero.nombres, cliente: cliente.empresa })
    } catch (error) {
        console.log(error)
    }
}

const eliminarDomi = async (req, res) => {
    const { id } = req.params

    try {
        const domi = await Domis.findById(id)
        const domiEliminado = await domi.deleteOne()
        return res.status(202).json({ msg: 'Domi Eliminado Correctamente' })
    } catch (error) {
        console.log(error)
    }
}

export {
    ingresarDomi,
    listarDomis,
    actualizarEstadoDomi,
    actualizarDomi,
    buscarDomi,
    eliminarDomi
}

