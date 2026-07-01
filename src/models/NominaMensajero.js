import mongoose from 'mongoose';

const NominaMensajeroSchema = new mongoose.Schema({
  mensajero: { type: mongoose.Schema.Types.ObjectId, ref: 'Mensajero', required: true },
  periodoDesde: { type: Date, required: true },
  periodoHasta: { type: Date, required: true },
  domiciliosCompletados: { type: Number, default: 0 },
  tarifaPromedio: { type: Number, default: 0 },
  totalBruto: { type: Number, default: 0 },
  bonificaciones: { type: Number, default: 0 },
  adelantos: { type: Number, default: 0 },
  prestamos: { type: Number, default: 0 },
  descuentos: { type: Number, default: 0 },
  vueltasPerdidas: { type: Number, default: 0 },
  totalDescuentos: { type: Number, default: 0 },
  totalNeto: { type: Number, default: 0 },
  estado: { type: String, enum: ['pendiente', 'pagado', 'anulado'], default: 'pendiente' },
  realizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  fechaPago: { type: Date },
  notas: { type: String, default: '' },
  numeroRecibo: { type: String, required: true, unique: true },
  ajustesAplicados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AjusteMensajero' }]
}, { timestamps: true });

// Prevent duplicate payrolls for same mensajero + period
NominaMensajeroSchema.index(
  { mensajero: 1, periodoDesde: 1, periodoHasta: 1 },
  { unique: true, partialFilterExpression: { estado: { $ne: 'anulado' } } }
);

export default mongoose.model('NominaMensajero', NominaMensajeroSchema);