import mongoose from "mongoose";

const cuadreSchema = mongoose.Schema({
    referencia: {
        type: String,
        required: true
    }, 
    recibidoPor: {
        type: String,
        required: true
    },
    colector: {
        type: String,
        required: true
    },
    valor: {
        type: Number,
        required: true
    }, 
    evidencia: {
        type: String
    }
})

const Cuadre = mongoose.model('Cuadre', cuadreSchema)

export default Cuadre