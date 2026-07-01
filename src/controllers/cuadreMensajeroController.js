import CuadreMensajero from '../models/CuadreMensajero.js';
import AjusteMensajero from '../models/AjusteMensajero.js';
import NominaMensajero from '../models/NominaMensajero.js';
import Mensajero from '../models/Mensajero.js';
import Domis from '../models/Domis.js';
import Cuadre from '../models/Cuadre.js';

// GET /api/cuadre-mensajero/pendientes
export const obtenerMensajerosPendientes = async (req, res) => {
  try {
    const cuadresExistentes = await CuadreMensajero.find().select('domiciliosIncluidos');
    const domisYaCuadrados = new Set(cuadresExistentes.flatMap(c => c.domiciliosIncluidos));

    const domisEntregados = await Domis.find({ estado: 'entregado' })
      .populate('mensajero', 'nombres cedula telefono')
      .populate('cliente', 'nombres empresa');

    const domisPendientes = domisEntregados.filter(d => d.mensajero && !domisYaCuadrados.has(d.noDomi));

    // Look up who collected payment for each domi (single query)
    const noDomisPendientes = domisPendientes.map(d => d.noDomi);
    const pagos = await Cuadre.find({ referencia: { $in: noDomisPendientes } })
      .select('referencia recibidoPor');
    const pagoPorDomi = new Map(pagos.map(p => [p.referencia, p]));

    const mensajeroMap = new Map();
    for (const domi of domisPendientes) {
      const mId = domi.mensajero._id.toString();
      if (!mensajeroMap.has(mId)) {
        mensajeroMap.set(mId, {
          mensajero: domi.mensajero,
          domicilios: [],
          totalAEntregar: 0,  // sum of valorDomi where messenger collected cash
          totalDomis: 0
        });
      }
      const entry = mensajeroMap.get(mId);
      const pago = pagoPorDomi.get(domi.noDomi);
      const recibidoPor = pago?.recibidoPor || null;
      // Messenger owes the full valorDomi only when he collected the cash himself
      const cobradoPorMensajero = recibidoPor === 'Mensajero';

      entry.domicilios.push({
        noDomi: domi.noDomi,
        valorDomi: domi.valorDomi,
        pagoMensajero: domi.pagoMensajero || 0,
        fecha: domi.fecha,
        direccion: domi.direccion,
        cliente: domi.cliente?.empresa || domi.cliente?.nombres || 'Sin cliente',
        recibidoPor: recibidoPor || 'Sin registrar',
        cobradoPorMensajero
      });

      if (cobradoPorMensajero) {
        entry.totalAEntregar += domi.valorDomi;
      }
      entry.totalDomis++;
    }

    return res.json(Array.from(mensajeroMap.values()));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al obtener mensajeros pendientes' });
  }
};

// POST /api/cuadre-mensajero/registrar
export const registrarCuadreMensajero = async (req, res) => {
  const { mensajeroId, domiciliosIncluidos, totalGananciaEsperada, totalEntregado, notas, periodoDesde, periodoHasta } = req.body;

  if (!mensajeroId || !Array.isArray(domiciliosIncluidos) || domiciliosIncluidos.length === 0) {
    return res.status(400).json({ msg: 'mensajeroId y domiciliosIncluidos son requeridos' });
  }

  const cuadresExistentes = await CuadreMensajero.find().select('domiciliosIncluidos');
  const domisYaCuadrados = new Set(cuadresExistentes.flatMap(c => c.domiciliosIncluidos));
  const duplicados = domiciliosIncluidos.filter(d => domisYaCuadrados.has(d));
  if (duplicados.length > 0) {
    return res.status(400).json({ msg: `Domicilios ya cuadrados: ${duplicados.join(', ')}` });
  }

  try {
    const diferencia = Number(totalEntregado) - Number(totalGananciaEsperada);
    const estado = diferencia >= 0 ? 'cuadrado' : 'con_diferencia';
    const numeroRecibo = `RM-${Date.now()}`;

    const nuevoCuadre = new CuadreMensajero({
      mensajero: mensajeroId,
      domiciliosIncluidos,
      totalGananciaEsperada: Number(totalGananciaEsperada),
      totalEntregado: Number(totalEntregado),
      diferencia,
      realizadoPor: req.admin._id,
      estado,
      notas: notas || '',
      numeroRecibo,
      periodoDesde: periodoDesde ? new Date(periodoDesde) : undefined,
      periodoHasta: periodoHasta ? new Date(periodoHasta) : undefined
    });

    await nuevoCuadre.save();

    // Reset the messenger's running totals — the CuadreMensajero receipt is the audit trail.
    // totalDomisPendientes is NOT reset: those are undelivered domis still in the field.
    await Mensajero.findByIdAndUpdate(mensajeroId, {
      totalGanancia: 0,
      totalRecibido: 0,
      diferencia: 0,
      totalDomisCompletados: 0
    });

    const cuadrePopulado = await CuadreMensajero.findById(nuevoCuadre._id)
      .populate('mensajero', 'nombres cedula telefono')
      .populate('realizadoPor', 'nombre usuario');

    return res.status(201).json({ msg: 'Cuadre registrado exitosamente', cuadre: cuadrePopulado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al registrar el cuadre' });
  }
};

// GET /api/cuadre-mensajero/historial
export const obtenerHistorialCuadresMensajero = async (req, res) => {
  try {
    const historial = await CuadreMensajero.find()
      .populate('mensajero', 'nombres cedula telefono')
      .populate('realizadoPor', 'nombre usuario')
      .sort({ fecha: -1 });
    return res.json(historial);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al obtener historial' });
  }
};

// GET /api/cuadre-mensajero/ajustes
export const listarAjustes = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.mensajeroId) filtro.mensajero = req.query.mensajeroId;
    if (req.query.estado) filtro.estado = req.query.estado;
    const ajustes = await AjusteMensajero.find(filtro)
      .populate('mensajero', 'nombres cedula')
      .populate('registradoPor', 'nombre usuario')
      .sort({ fecha: -1 });
    return res.json(ajustes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al listar ajustes' });
  }
};

// POST /api/cuadre-mensajero/ajustes
export const registrarAjuste = async (req, res) => {
  const { mensajeroId, tipo, valor, descripcion, fecha } = req.body;
  if (!mensajeroId || !tipo || valor === undefined || valor === null) {
    return res.status(400).json({ msg: 'mensajeroId, tipo y valor son requeridos' });
  }
  if (Number(valor) < 0) {
    return res.status(400).json({ msg: 'El valor no puede ser negativo' });
  }
  const tiposValidos = ['adelanto', 'prestamo', 'bonificacion', 'descuento', 'vuelta_perdida'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ msg: 'Tipo de ajuste inválido' });
  }
  try {
    const ajuste = new AjusteMensajero({
      mensajero: mensajeroId,
      tipo,
      valor: Number(valor),
      descripcion: descripcion || '',
      fecha: fecha ? new Date(fecha) : new Date(),
      registradoPor: req.admin._id
    });
    await ajuste.save();
    const ajustePopulado = await AjusteMensajero.findById(ajuste._id)
      .populate('mensajero', 'nombres cedula')
      .populate('registradoPor', 'nombre usuario');
    return res.status(201).json({ msg: 'Ajuste registrado', ajuste: ajustePopulado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al registrar ajuste' });
  }
};

// PUT /api/cuadre-mensajero/ajustes/:id/anular
export const anularAjuste = async (req, res) => {
  try {
    const ajuste = await AjusteMensajero.findById(req.params.id);
    if (!ajuste) return res.status(404).json({ msg: 'Ajuste no encontrado' });
    if (ajuste.estado === 'aplicado') {
      return res.status(400).json({ msg: 'No se puede anular un ajuste ya aplicado a una nómina' });
    }
    ajuste.estado = 'anulado';
    await ajuste.save();
    return res.json({ msg: 'Ajuste anulado', ajuste });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al anular ajuste' });
  }
};

// GET /api/cuadre-mensajero/nominas
export const listarNominas = async (req, res) => {
  try {
    const nominas = await NominaMensajero.find()
      .populate('mensajero', 'nombres cedula telefono')
      .populate('realizadoPor', 'nombre usuario')
      .sort({ createdAt: -1 });
    return res.json(nominas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al listar nóminas' });
  }
};

// POST /api/cuadre-mensajero/nominas/generar
export const generarNomina = async (req, res) => {
  const { mensajeroId, periodoDesde, periodoHasta, notas } = req.body;

  if (!mensajeroId || !periodoDesde || !periodoHasta) {
    return res.status(400).json({ msg: 'mensajeroId, periodoDesde y periodoHasta son requeridos' });
  }

  const desdeFecha = new Date(periodoDesde);
  desdeFecha.setUTCHours(0, 0, 0, 0);
  const hastaFecha = new Date(periodoHasta);
  hastaFecha.setUTCHours(23, 59, 59, 999);

  const existente = await NominaMensajero.findOne({
    mensajero: mensajeroId,
    periodoDesde: desdeFecha,
    periodoHasta: hastaFecha,
    estado: { $ne: 'anulado' }
  });
  if (existente) {
    return res.status(400).json({ msg: 'Ya existe una nómina para este mensajero en ese período' });
  }

  try {
    const domisCompletados = await Domis.find({
      mensajero: mensajeroId,
      estado: 'entregado',
      fecha: { $gte: desdeFecha, $lte: hastaFecha }
    });

    const totalDomis = domisCompletados.length;
    const totalBruto = domisCompletados.reduce((sum, d) => sum + (d.pagoMensajero || 0), 0);
    const tarifaPromedio = totalDomis > 0 ? totalBruto / totalDomis : 0;

    const ajustesPendientes = await AjusteMensajero.find({
      mensajero: mensajeroId,
      estado: 'pendiente'
    });

    let bonificaciones = 0, adelantos = 0, prestamos = 0, descuentos = 0, vueltasPerdidas = 0;
    for (const aj of ajustesPendientes) {
      if (aj.tipo === 'bonificacion') bonificaciones += aj.valor;
      else if (aj.tipo === 'adelanto') adelantos += aj.valor;
      else if (aj.tipo === 'prestamo') prestamos += aj.valor;
      else if (aj.tipo === 'descuento') descuentos += aj.valor;
      else if (aj.tipo === 'vuelta_perdida') vueltasPerdidas += aj.valor;
    }

    const totalDescuentos = adelantos + prestamos + descuentos + vueltasPerdidas;
    const totalNeto = Math.max(0, totalBruto + bonificaciones - totalDescuentos);
    const numeroRecibo = `NOM-${Date.now()}`;

    const nomina = new NominaMensajero({
      mensajero: mensajeroId,
      periodoDesde: desdeFecha,
      periodoHasta: hastaFecha,
      domiciliosCompletados: totalDomis,
      tarifaPromedio,
      totalBruto,
      bonificaciones,
      adelantos,
      prestamos,
      descuentos,
      vueltasPerdidas,
      totalDescuentos,
      totalNeto,
      notas: notas || '',
      numeroRecibo,
      realizadoPor: req.admin._id,
      ajustesAplicados: ajustesPendientes.map(a => a._id)
    });

    await nomina.save();

    if (ajustesPendientes.length > 0) {
      await AjusteMensajero.updateMany(
        { _id: { $in: ajustesPendientes.map(a => a._id) } },
        { $set: { estado: 'aplicado', nominaId: nomina._id } }
      );
    }

    const nominaPopulada = await NominaMensajero.findById(nomina._id)
      .populate('mensajero', 'nombres cedula telefono')
      .populate('realizadoPor', 'nombre usuario');

    return res.status(201).json({ msg: 'Nómina generada exitosamente', nomina: nominaPopulada });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al generar nómina' });
  }
};

// PUT /api/cuadre-mensajero/nominas/:id/marcar-pagado
export const marcarNominaPagada = async (req, res) => {
  try {
    const nomina = await NominaMensajero.findById(req.params.id)
      .populate('mensajero', 'nombres cedula telefono')
      .populate('realizadoPor', 'nombre usuario');
    if (!nomina) return res.status(404).json({ msg: 'Nómina no encontrada' });
    if (nomina.estado === 'pagado') return res.status(400).json({ msg: 'La nómina ya está pagada' });
    nomina.estado = 'pagado';
    nomina.fechaPago = new Date();
    await nomina.save();
    return res.json({ msg: 'Nómina marcada como pagada', nomina });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al marcar nómina como pagada' });
  }
};

// PUT /api/cuadre-mensajero/nominas/:id/anular
export const anularNomina = async (req, res) => {
  try {
    const nomina = await NominaMensajero.findById(req.params.id);
    if (!nomina) return res.status(404).json({ msg: 'Nómina no encontrada' });
    if (nomina.estado === 'pagado') return res.status(400).json({ msg: 'No se puede anular una nómina ya pagada' });

    nomina.estado = 'anulado';
    await nomina.save();

    // Revert adjustments to pending so they can be applied to a new payroll
    if (nomina.ajustesAplicados.length > 0) {
      await AjusteMensajero.updateMany(
        { _id: { $in: nomina.ajustesAplicados } },
        { $set: { estado: 'pendiente', nominaId: null } }
      );
    }

    return res.json({ msg: 'Nómina anulada', nomina });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al anular nómina' });
  }
};