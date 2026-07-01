import mongoose from 'mongoose'

const domisSchema = mongoose.Schema({
    noDomi: {
        type: String,
        required: true
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    mensajero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mensajero',
        required: true
    },
    valorDomi: {
        type: Number,
        required: true
    }, 
    pagoMensajero: {
        type: Number,
        required: true
    },
    ruta: {
        type: String,
        required: true
    }, 
    fecha: {
        type: Date,
        required: true
    }, 
    nombreEntrega: {
        type: String
    }, 
    direccion: {
        type: String,
        required: true
    }, 
    telefono: {
        type: String
    }, 
    notas: {
        type: String
    },
    estado: {
        type: String,
        default: 'pendiente por recoger'
    }
})

const Domis = mongoose.model('Domis', domisSchema)

export default Domis