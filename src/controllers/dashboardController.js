import Domis from '../models/Domis.js';
import CuadreCliente from '../models/CuadreCliente.js';

const getRange = (periodo) => {
  const now = new Date();
  let desde, desdeAnterior;

  if (periodo === 'hoy') {
    desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    desdeAnterior = new Date(desde.getTime() - 86_400_000);
  } else if (periodo === 'semana') {
    desde = new Date(now.getTime() - 6 * 86_400_000);
    desde.setUTCHours(0, 0, 0, 0);
    desdeAnterior = new Date(desde.getTime() - 7 * 86_400_000);
  } else {
    desde = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    desdeAnterior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  }

  return { desde, desdeAnterior };
};

const calcMetricas = (domis) => {
  const entregados = domis.filter(d => d.estado === 'entregado');
  const pendientes = domis.filter(d => ['pendiente por recoger', 'en bodega', 'en ruta'].includes(d.estado));
  const rechazados = domis.filter(d => d.estado === 'rechazado');
  const ingresos = entregados.reduce((s, d) => s + (d.valorDomi || 0), 0);
  return {
    total: domis.length,
    entregados: entregados.length,
    pendientes: pendientes.length,
    rechazados: rechazados.length,
    ingresos,
    tasaEntrega: domis.length > 0 ? +((entregados.length / domis.length) * 100).toFixed(1) : 0,
    promedio: entregados.length > 0 ? Math.round(ingresos / entregados.length) : 0,
  };
};

const pct = (a, b) => {
  if (!b || b === 0) return a > 0 ? 100 : 0;
  return +((( a - b) / b) * 100).toFixed(1);
};

// GET /api/dashboard/resumen?periodo=hoy|semana|mes
export const obtenerResumenDashboard = async (req, res) => {
  try {
    const { periodo = 'hoy' } = req.query;
    const { desde, desdeAnterior } = getRange(periodo);

    const [domisActual, domisPrevio, cuadresExistentes] = await Promise.all([
      Domis.find({ fecha: { $gte: desde } })
        .populate('cliente', 'nombres empresa')
        .populate('mensajero', 'nombres'),
      Domis.find({ fecha: { $gte: desdeAnterior, $lt: desde } }),
      CuadreCliente.find().select('domiciliosIncluidos'),
    ]);

    const a = calcMetricas(domisActual);
    const p = calcMetricas(domisPrevio);

    // Por cobrar: entregados not in any CuadreCliente record
    const domisYaCuadrados = new Set(cuadresExistentes.flatMap(c => c.domiciliosIncluidos));
    const domisSinCuadrar = domisActual.filter(d => d.estado === 'entregado' && !domisYaCuadrados.has(d.noDomi));
    const porCobrar = domisSinCuadrar.reduce((s, d) => s + (d.valorDomi || 0), 0);
    const clientesPendientes = new Set(domisSinCuadrar.map(d => d.cliente?._id?.toString()).filter(Boolean)).size;

    // KPIs con comparación vs período anterior
    const kpis = {
      totalDomis:  { valor: a.total,        cambio: pct(a.total,        p.total) },
      entregados:  { valor: a.entregados,    cambio: pct(a.entregados,   p.entregados) },
      pendientes:  { valor: a.pendientes,    cambio: pct(a.pendientes,   p.pendientes) },
      rechazados:  { valor: a.rechazados,    cambio: pct(a.rechazados,   p.rechazados) },
      ingresos:    { valor: a.ingresos,      cambio: pct(a.ingresos,     p.ingresos) },
      porCobrar:   { valor: porCobrar,       cambio: 0 },
      tasaEntrega: { valor: a.tasaEntrega,   cambio: pct(a.tasaEntrega,  p.tasaEntrega) },
      promedio:    { valor: a.promedio,      cambio: pct(a.promedio,     p.promedio) },
    };

    // Evolución diaria
    const mapaFechas = {};
    domisActual.forEach(d => {
      const key = new Date(d.fecha).toISOString().split('T')[0];
      if (!mapaFechas[key]) mapaFechas[key] = { fecha: key, total: 0, entregados: 0, rechazados: 0, pendientes: 0 };
      mapaFechas[key].total++;
      if (d.estado === 'entregado') mapaFechas[key].entregados++;
      else if (d.estado === 'rechazado') mapaFechas[key].rechazados++;
      else mapaFechas[key].pendientes++;
    });
    const evolucionDiaria = Object.values(mapaFechas).sort((x, y) => x.fecha.localeCompare(y.fecha));

    // Rendimiento mensajeros
    const mapaMen = {};
    domisActual.forEach(d => {
      if (!d.mensajero) return;
      const id = d.mensajero._id?.toString();
      if (!mapaMen[id]) mapaMen[id] = { nombre: d.mensajero.nombres || '—', entregados: 0, pendientes: 0, rechazados: 0 };
      if (d.estado === 'entregado') mapaMen[id].entregados++;
      else if (d.estado === 'rechazado') mapaMen[id].rechazados++;
      else mapaMen[id].pendientes++;
    });
    const mensajeros = Object.values(mapaMen).sort((x, y) => y.entregados - x.entregados).slice(0, 6);

    // Top clientes del período
    const mapaCli = {};
    domisActual.forEach(d => {
      if (!d.cliente) return;
      const id = d.cliente._id?.toString();
      if (!mapaCli[id]) mapaCli[id] = { empresa: d.cliente.empresa || '—', total: 0, entregados: 0, valor: 0 };
      mapaCli[id].total++;
      if (d.estado === 'entregado') { mapaCli[id].entregados++; mapaCli[id].valor += d.valorDomi || 0; }
    });
    const topClientes = Object.values(mapaCli).sort((x, y) => y.total - x.total).slice(0, 5);

    // Actividad reciente
    const actividadReciente = [...domisActual]
      .sort((x, y) => new Date(y.fecha) - new Date(x.fecha))
      .slice(0, 6)
      .map(d => ({
        noDomi: d.noDomi,
        cliente: d.cliente?.empresa || '—',
        mensajero: d.mensajero?.nombres || '—',
        estado: d.estado,
        valorDomi: d.valorDomi,
        fecha: d.fecha,
      }));

    // Alertas
    const hoy = new Date(); hoy.setUTCHours(0, 0, 0, 0);
    const rechazadosHoy = domisActual.filter(d => d.estado === 'rechazado' && new Date(d.fecha) >= hoy).length;
    const mensajerosConPendientes = Object.values(mapaMen).filter(m => m.pendientes > 0).length;

    return res.json({
      kpis,
      graficos: {
        evolucionDiaria,
        distribucionEstado: [
          { name: 'Entregados', value: a.entregados, color: '#22c55e' },
          { name: 'Pendientes', value: a.pendientes, color: '#f97316' },
          { name: 'Rechazados', value: a.rechazados, color: '#ef4444' },
        ].filter(e => e.value > 0),
        mensajeros,
        topClientes,
      },
      alertas: { clientesPendientes, rechazadosHoy, mensajerosConPendientes },
      actividadReciente,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al obtener el resumen del dashboard' });
  }
};