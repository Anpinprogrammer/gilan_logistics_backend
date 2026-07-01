import mongoose from 'mongoose';

const AjusteMensajeroSchema = new mongoose.Schema({
  mensajero: { type: mongoose.Schema.Types.ObjectId, ref: 'Mensajero', required: true },
  tipo: {
    type: String,
    enum: ['adelanto', 'prestamo', 'bonificacion', 'descuento', 'vuelta_perdida'],
    required: true
  },
  valor: { type: Number, required: true, min: 0 },
  fecha: { type: Date, default: Date.now },
  descripcion: { type: String, default: '' },
  estado: { type: String, enum: ['pendiente', 'aplicado', 'anulado'], default: 'pendiente' },
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  nominaId: { type: mongoose.Schema.Types.ObjectId, ref: 'NominaMensajero', default: null }
}, { timestamps: true });

export default mongoose.model('AjusteMensajero', AjusteMensajeroSchema);