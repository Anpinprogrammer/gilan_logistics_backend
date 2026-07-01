import Cliente from "../models/Cliente.js";

export const ingresarCliente = async (req, res) => {

    const { identificacion } = req.body;

    const clienteExistente = await Cliente.findOne({ identificacion })

    try {
        if(clienteExistente){
            return res.status(404).json({ msg: 'El cliente ya esta registrado' })
        }

        const nuevoCliente = new Cliente(req.body);
        const nuevoClienteGuardado = await nuevoCliente.save();
        return res.status(200).json({ cliente: nuevoClienteGuardado._id, identificacion: nuevoCliente.identificacion, msg: 'Cliente agregado satisfactoriamente' });
    } catch (e) {
        const error = new Error('Error, no se pudo ingresar el cliente')
        return res.status(404).json({ msg: error.message })
    }
    
}

export const listadoClientes = async (req, res) => {
    const clientes = await Cliente.find();
    return res.status(200).json(clientes)
}

export const listadoCliente = async (req, res) => {
    const { id } = req.params

    try {
        const cliente = await Cliente.findById(id)
        return res.status(202).json(cliente)
    } catch (error) {
        console.log(error)
    }
    
}

export const actualizarCliente = async (req, res) => {
    const { id } = req.params
    const { nombres, identificacion, direccion, telefono, empresa, descripcion } = req.body

    try {
        const cliente = await Cliente.findById(id)
        cliente.nombres = nombres || cliente.nombres;
        cliente.identificacion = identificacion || cliente.identificacion;
        cliente.direccion = direccion || cliente.direccion;
        cliente.telefono = telefono || cliente.telefono;
        cliente.empresa = empresa || cliente.empresa;
        cliente.descripcion = descripcion || cliente.descripcion;

        const clienteActualizado = await cliente.save()

        return res.status(202).json({ msg: 'Cliente Actualizado con Exito' })
    } catch (error) {
        console.log(error)
    }
}

export const eliminarCliente = async (req, res) => {
    const { id } = req.params

    try {
        const cliente = await Cliente.findById(id)
        const clienteEliminado = await cliente.deleteOne()
        return res.status(202).json({ msg: 'Cliente Eliminado Satisfactoriamente' })
    } catch (error) {
        console.log(error)
    }
}