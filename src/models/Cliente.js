import mongoose from 'mongoose'

const clienteSchema = mongoose.Schema({
    identificacion: {
        type: String,
        trim: true,
        default: '0000000000'
    },
    nombres: {
        type: String,
        requied: true
    },
    direccion:{
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        required: true
    },
    empresa: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: false
    },
    domicilios: [
        {
        type: String,
        required: true
        }
    ],
     valorCliente: {
        type: Number,
        default: 0
    },
    valorJS: {
        type: Number,
        default: 0
    },
    diferenciaJS: {
        type: Number,
        default: 0,
    },
    totalDomis: {
        type: Number,
        default: 0
    },
    totalValor: {
        type: Number,
        default: 0
    },
    totalValorEsperado: {
        type: Number,
        default: 0
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    } 
})

const Cliente = mongoose.model('Cliente', clienteSchema)

export default Cliente