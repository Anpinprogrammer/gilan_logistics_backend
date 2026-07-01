import mongoose from 'mongoose';

const CuadreClienteSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  domiciliosIncluidos: {
    type: [String],
    default: []
  },
  totalEsperado: {
    type: Number,
    default: 0
  },
  totalRecibido: {
    type: Number,
    default: 0
  },
  diferencia: {
    type: Number,
    default: 0
  },
  realizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  estado: {
    type: String,
    enum: ['cuadrado', 'con_diferencia'],
    default: 'cuadrado'
  },
  notas: {
    type: String,
    default: ''
  },
  numeroRecibo: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model('CuadreCliente', CuadreClienteSchema);