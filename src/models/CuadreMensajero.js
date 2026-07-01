import mongoose from 'mongoose';

const CuadreMensajeroSchema = new mongoose.Schema({
  mensajero: { type: mongoose.Schema.Types.ObjectId, ref: 'Mensajero', required: true },
  fecha: { type: Date, default: Date.now },
  domiciliosIncluidos: { type: [String], default: [] },
  totalGananciaEsperada: { type: Number, default: 0 },
  totalEntregado: { type: Number, default: 0 },
  diferencia: { type: Number, default: 0 },
  realizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  estado: { type: String, enum: ['cuadrado', 'con_diferencia'], default: 'cuadrado' },
  notas: { type: String, default: '' },
  numeroRecibo: { type: String, required: true, unique: true },
  periodoDesde: { type: Date },
  periodoHasta: { type: Date }
}, { timestamps: true });

export default mongoose.model('CuadreMensajero', CuadreMensajeroSchema);