import Cuadre from "../models/Cuadre.js"
import Domis from "../models/Domis.js"
import Cliente from "../models/Cliente.js"
import Mensajero from "../models/Mensajero.js"
import CuadreCliente from "../models/CuadreCliente.js"

export const ingresarCuadre = async (req, res) => {
    const { id, recibidoPor, valor} = req.body
    let colector = ''
    let valorCliente = 0
    let valorJS = 0
    try {
        const domi = await Domis.findById(id)
        const clienteId = domi.cliente._id
        const mensajeroId = domi.mensajero._id
        const mensajero = await Mensajero.findById(mensajeroId);

        if (!mensajero) {
            throw new Error("Mensajero no encontrado");
        }
        if(recibidoPor === 'Mensajero'){
            try {
                const mensajero = await Mensajero.findById(domi.mensajero)
                colector = mensajero.nombres
                valorJS = valor

                //Actualiza el valor recibido por el mensajero y su diferencia personal
                const mensajeroActualizado = await Mensajero.findByIdAndUpdate(
                    mensajeroId,
                    {
                        totalRecibido: (mensajero.totalRecibido || 0) + Number(valor),
                        diferencia: (mensajero.diferencia) + Number(valor)
                    },
                    { new: true }
                )
            } catch (error) {
                console.log(error)
            }
        } else if (recibidoPor === 'Cliente'){
            try {
                const cliente = await Cliente.findById(domi.cliente)    
                colector = cliente.empresa      
                valorCliente = valor      
            } catch (error) {
                console.log(error)
            }
        } else {
            colector = recibidoPor
            valorJS = valor
        }

        const cuadre = await Cuadre.findOne({ referencia: domi.noDomi })

        if(!cuadre){    
            const nuevoCuadre = new Cuadre({...req.body, referencia: domi.noDomi, recibidoPor, colector: colector})
            const cuadreGuardado = await nuevoCuadre.save()

        // Busca el cliente actual
        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            throw new Error("Cliente no encontrado");
        }

        // Asegurar conversión a número
        const valorJSnum = Number(valorJS) || 0;
        const valorClientenum = Number(valorCliente) || 0;
        const valorDomiNum = Number(domi.valorDomi) || 0;

        // Calcula los nuevos totales
        const nuevoTotalDomis = (cliente.totalDomis || 0) + 1;
        const nuevoValorJS = (cliente.valorJS || 0) + valorJSnum;
        const nuevoValorCliente = (cliente.valorCliente || 0) + valorClientenum;
        const nuevoTotalValorEsperado = (cliente.totalValorEsperado || 0) + valorDomiNum;

        // Calcula la diferencia (esperado - recibido por JS)
        const nuevaDiferenciaJS = nuevoValorJS - nuevoTotalValorEsperado;

        // Actualiza el cliente
        const clienteActualizado = await Cliente.findByIdAndUpdate(
        clienteId,
        {
            $set: {
                    totalDomis: nuevoTotalDomis,
                    valorCliente: nuevoValorCliente,
                    valorJS: nuevoValorJS,
                    totalValorEsperado: nuevoTotalValorEsperado,
                    diferenciaJS: nuevaDiferenciaJS,
                    ultimaActualizacion: new Date(),
                },
            $addToSet: { domicilios: domi.noDomi },
        },
        { new: true }
        );

        //Busca y actualiza el mensajero, Calcular los nuevos totales para el mensajero
        const mensajeroActualizado = await Mensajero.findByIdAndUpdate(
            mensajeroId,
            {
                totalDomisCompletados: (mensajero.totalDomisCompletados || 0) + 1,
                totalDomisPendientes: (mensajero.totalDomisPendientes) - 1
            },
            { new: true }
        )

        return res.status(202).json({ msg: 'Domi registrado en el cuadre satisfactoriamente' })  
        } else {
            try {
                cuadre.recibidoPor = recibidoPor || cuadre.recibidoPor
                cuadre.colector = colector || cuadre.colector
                const cuadreGuardado = await cuadre.save()
                return res.status(202).json({ msg: 'Domi registrado en el cuadre satisfactoriamente' })  
            } catch (error) {
                console.log(error)
            }
        } 
          
    } catch (error) {
        console.log(error)
    }
    
}

export const listarCuadre = async (req, res) => {
    try {
        const cuadres = await Cuadre.find()
        return res.json(cuadres)
    } catch (error) {
        console.log(error)
    }
} 

// GET /cuadre/clientes
export const obtenerResumenClientes = async (req, res) => {
  try {
    const resumen = await Cliente.find();
    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener resumen de clientes' });
  }
};

// GET /cuadre/pendientes-clientes
export const obtenerClientesPendientes = async (req, res) => {
  try {
    const cuadresExistentes = await CuadreCliente.find().select('domiciliosIncluidos');
    const domisYaCuadrados = new Set(cuadresExistentes.flatMap(c => c.domiciliosIncluidos));

    const domisEntregados = await Domis.find({ estado: 'entregado' })
      .populate('cliente', 'nombres empresa direccion telefono identificacion')
      .populate('mensajero', 'nombres');

    const domisPendientes = domisEntregados.filter(d => !domisYaCuadrados.has(d.noDomi));

    // Fetch individual payment records for all pending domis in one query
    const noDomisPendientes = domisPendientes.map(d => d.noDomi);
    const cuadrosPago = await Cuadre.find({ referencia: { $in: noDomisPendientes } }).select('referencia recibidoPor colector valor');
    const pagoPorDomi = new Map(cuadrosPago.map(c => [c.referencia, c]));

    const clienteMap = new Map();
    for (const domi of domisPendientes) {
      if (!domi.cliente) continue;
      const cId = domi.cliente._id.toString();
      if (!clienteMap.has(cId)) {
        clienteMap.set(cId, {
          cliente: domi.cliente,
          domicilios: [],
          totalEsperado: 0,
          totalDomis: 0
        });
      }
      const entry = clienteMap.get(cId);
      const pago = pagoPorDomi.get(domi.noDomi);
      const recibidoPor = pago?.recibidoPor || null;
      // Only money received by the client is owed back to us
      const cobrableAlCliente = recibidoPor === 'Cliente';

      entry.domicilios.push({
        noDomi: domi.noDomi,
        valorDomi: domi.valorDomi,
        fecha: domi.fecha,
        direccion: domi.direccion,
        mensajero: domi.mensajero?.nombres || '',
        recibidoPor: recibidoPor || 'Sin registrar',
        cobrableAlCliente
      });
      if (cobrableAlCliente) {
        entry.totalEsperado += domi.valorDomi;
      }
      entry.totalDomis++;
    }

    return res.json(Array.from(clienteMap.values()));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al obtener clientes pendientes' });
  }
};

// POST /cuadre/registrar-cuadre-cliente
export const registrarCuadreCliente = async (req, res) => {
  const { clienteId, domiciliosIncluidos, totalEsperado, totalRecibido, notas } = req.body;
  if (!clienteId || !domiciliosIncluidos?.length) {
    return res.status(400).json({ msg: 'clienteId y domiciliosIncluidos son requeridos' });
  }
  try {
    const diferencia = Number(totalRecibido) - Number(totalEsperado);
    const estado = diferencia >= 0 ? 'cuadrado' : 'con_diferencia';
    const numeroRecibo = `RC-${Date.now()}`;

    const nuevoCuadre = new CuadreCliente({
      cliente: clienteId,
      domiciliosIncluidos,
      totalEsperado: Number(totalEsperado),
      totalRecibido: Number(totalRecibido),
      diferencia,
      realizadoPor: req.admin._id,
      estado,
      notas: notas || '',
      numeroRecibo
    });

    await nuevoCuadre.save();
    const cuadrePopulado = await CuadreCliente.findById(nuevoCuadre._id)
      .populate('cliente', 'nombres empresa direccion telefono')
      .populate('realizadoPor', 'nombre usuario');

    return res.status(201).json({ msg: 'Cuadre registrado exitosamente', cuadre: cuadrePopulado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al registrar el cuadre' });
  }
};

// GET /cuadre/historial-cuadres
export const obtenerHistorialCuadres = async (req, res) => {
  try {
    const historial = await CuadreCliente.find()
      .populate('cliente', 'nombres empresa direccion telefono')
      .populate('realizadoPor', 'nombre usuario')
      .sort({ fecha: -1 });
    return res.json(historial);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error al obtener historial de cuadres' });
  }
};

export const obtenerResumenMensajeros = async (req, res) => {
    console.log('Obteniendo el cuadre para los mensajeros')

    try {
        const resultados = await Domis.aggregate([
      {
        $lookup: {
          from: 'cuadres',
          localField: 'noDomi',
          foreignField: 'referencia',
          as: 'cuadreData'
        }
      },
      {
        $addFields: {
          recibidoPor: {
            $cond: [
              { $eq: ["$estado", "entregado"] },
              { $ifNull: [{ $arrayElemAt: ["$cuadreData.recibidoPor", 0] }, "No Completado"] },
              "No Completado"
            ]
          },
          valor: {
            $cond: [
              { $eq: ["$estado", "entregado"] },
              { $ifNull: [{ $arrayElemAt: ["$cuadreData.valor", 0] }, 0] },
              0
            ]
          }
        }

      },
      {
        $project: {
          _id: 0,
          noDomi: 1,
          estado: 1,
          pagoMensajero: 1,
          recibidoPor: 1,
          valor: 1
        }
      }
    ]);

    return res.json(resultados)
       
    } catch (error) {
        console.log(error)
    }
}