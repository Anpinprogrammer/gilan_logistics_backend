### Backend

```bash
cd backend
npm install
npm run dev
```

El servidor arranca en `http://localhost:4000`.

> Para producción usar `npm start` en lugar de `npm run dev`.



| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Clave secreta para firmar y verificar los JWT. Cambiar en producción. |

> La cadena de conexión a MongoDB Atlas está actualmente hardcodeada en `backend/src/config/db.js`. Base de datos: `jslogistics`.

---

## Credenciales de acceso

Para ingresar al panel de administración en desarrollo:

| Campo | Valor |
|---|---|
| Usuario | `Javi123` |
| Contraseña | `123456` |

Para crear un nuevo administrador, hacer POST a `/api/admin/ingresar-admin` con `{ nombre, correo, usuario, password }`.

---

## Backend

### Estructura de carpetas (backend)

```
backend/
├── .env
├── package.json
└── src/
    ├── index.js                  # Punto de entrada: Express, CORS, middlewares, rutas
    ├── config/
    │   └── db.js                 # Conexión a MongoDB Atlas
    ├── middleware/
    │   └── authMiddleware.js     # checkAuth: verifica cookie JWT, adjunta req.admin
    ├── models/
    │   ├── Admin.js
    │   ├── Cliente.js
    │   ├── Mensajero.js
    │   ├── Domis.js
    │   ├── Cuadre.js
    │   ├── CuadreCliente.js        # Cuadres cerrados por cliente (RC-<timestamp>)
    │   ├── CuadreMensajero.js      # Cuadres cerrados por mensajero (RM-<timestamp>)
    │   ├── AjusteMensajero.js      # Adelantos, préstamos, bonif., descuentos, vueltas perdidas
    │   └── NominaMensajero.js      # Nóminas de pago con cálculo automático (NOM-<timestamp>)
    ├── controllers/
    │   ├── adminController.js
    │   ├── clientesController.js
    │   ├── mensajerosController.js
    │   ├── domisController.js
    │   ├── cuadreController.js
    │   ├── dashboardController.js    # Métricas y datos agregados para el dashboard
    │   └── cuadreMensajeroController.js  # Cuadres, ajustes y nóminas de mensajeros
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── clientesRoutes.js
    │   ├── mensajerosRoutes.js
    │   ├── domisRoutes.js
    │   ├── cuadreRoutes.js
    │   ├── dashboardRoutes.js        # GET /api/dashboard/resumen
    │   └── cuadreMensajeroRoutes.js  # /api/cuadre-mensajero/*
    └── helpers/
        ├── domicilios.js         # rutaMap: { 1: 'mañana', 2: 'tarde', 3: 'noche' }
        ├── generarId.js          # Generador de IDs aleatorios
        └── generarJWT.js         # Genera JWT con expiración de 30 días
```

---

### Modelos de datos

#### Admin
| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre completo |
| `correo` | String | Correo electrónico |
| `usuario` | String | Nombre de usuario para login |
| `password` | String | Hash bcrypt (salt 10) |
| `token` | String | Token de sesión |
| `confirmado` | Boolean | Estado de confirmación (default: false) |

#### Cliente
| Campo | Tipo | Descripción |
|---|---|---|
| `identificacion` | String | Documento de identidad (default: '0000000000') |
| `nombres` | String | Nombre del contacto |
| `empresa` | String | Nombre de la empresa |
| `direccion` | String | Dirección de recogida |
| `telefono` | String | Teléfono de contacto |
| `descripcion` | String | Notas adicionales |
| `domicilios` | [String] | Lista de `noDomi` asociados al cliente |
| `valorCliente` | Number | Total cobrado al cliente directamente (pagos COD del cliente) |
| `valorJS` | Number | Total recibido por JS Logistics (pagos vía mensajero u otro) |
| `diferenciaJS` | Number | Diferencia entre lo recibido por JS y lo esperado |
| `totalDomis` | Number | Cantidad de domicilios cuadrados individualmente |
| `totalValorEsperado` | Number | Suma de `valorDomi` de todos los domicilios cuadrados |
| `ultimaActualizacion` | Date | Fecha del último cuadre individual |

#### Mensajero
| Campo | Tipo | Descripción |
|---|---|---|
| `nombres` | String | Nombre completo |
| `cedula` | String | Cédula de ciudadanía (único) |
| `telefono` | String | Teléfono |
| `usuario` | String | Usuario de acceso |
| `password` | String | Hash bcrypt (salt 10) |
| `domicilios` | [String] | Lista de `noDomi` asignados |
| `domiciliosCompleRuta` | [String] | Domicilios completados por ruta |
| `totalDomis` | Number | Total de domicilios asignados |
| `totalDomisCompletados` | Number | Domicilios entregados |
| `totalDomisPendientes` | Number | Domicilios pendientes |
| `totalGanancia` | Number | Total generado (suma de `pagoMensajero`) |
| `totalRecibido` | Number | Dinero efectivamente recibido |
| `diferencia` | Number | Diferencia entre lo esperado y lo recibido |

#### Domis (Domicilio)
| Campo | Tipo | Descripción |
|---|---|---|
| `noDomi` | String | Código único del domicilio (generado con `shortid`) |
| `cliente` | ObjectId → Cliente | Referencia al cliente |
| `mensajero` | ObjectId → Mensajero | Referencia al mensajero |
| `valorDomi` | Number | Valor total del domicilio |
| `pagoMensajero` | Number | Pago al mensajero (70% del valorDomi) |
| `ruta` | String | `'mañana'`, `'tarde'` o `'noche'` |
| `fecha` | Date | Fecha de entrega programada |
| `nombreEntrega` | String | Nombre de quien recibe |
| `direccion` | String | Dirección de entrega |
| `telefono` | String | Teléfono del receptor |
| `notas` | String | Instrucciones especiales |
| `estado` | String | Estado actual del domicilio |

**Estados posibles de un domicilio:**
```
pendiente por recoger → en bodega → en ruta → entregado  (estado final, no editable)
                                            ↘ rechazado
```

> Un domicilio marcado como **entregado** no puede cambiar de estado. La barra de progreso se reemplaza por un banner verde de confirmación.

#### Cuadre (pago individual por domicilio)
| Campo | Tipo | Descripción |
|---|---|---|
| `referencia` | String | `noDomi` del domicilio cuadrado |
| `recibidoPor` | String | `'Mensajero'`, `'Cliente'` u otro colector |
| `colector` | String | Nombre de quien recibió el dinero |
| `valor` | Number | Valor registrado en el pago |
| `evidencia` | String | URL o referencia del comprobante |

#### CuadreCliente (cuadre cerrado por cliente)
| Campo | Tipo | Descripción |
|---|---|---|
| `cliente` | ObjectId → Cliente | Cliente al que corresponde el cuadre |
| `fecha` | Date | Fecha en que se realizó el cuadre |
| `domiciliosIncluidos` | [String] | Lista de `noDomi` incluidos en este cuadre |
| `totalEsperado` | Number | Suma de `valorDomi` de domis cobrados al cliente |
| `totalRecibido` | Number | Dinero efectivamente recibido del cliente |
| `diferencia` | Number | `totalRecibido - totalEsperado` (negativo = faltante) |
| `realizadoPor` | ObjectId → Admin | Admin que ejecutó el cuadre |
| `estado` | String | `'cuadrado'` o `'con_diferencia'` |
| `notas` | String | Observaciones del cuadre |
| `numeroRecibo` | String | Identificador único del recibo (`RC-<timestamp>`) |

#### CuadreMensajero (cuadre cerrado por mensajero)
| Campo | Tipo | Descripción |
|---|---|---|
| `mensajero` | ObjectId → Mensajero | Mensajero al que corresponde el cuadre |
| `fecha` | Date | Fecha en que se realizó el cuadre |
| `domiciliosIncluidos` | [String] | Lista de `noDomi` incluidos en este cuadre |
| `totalGananciaEsperada` | Number | Suma de `pagoMensajero` de los domicilios incluidos |
| `totalEntregado` | Number | Dinero efectivamente entregado por el mensajero |
| `diferencia` | Number | `totalEntregado - totalGananciaEsperada` |
| `realizadoPor` | ObjectId → Admin | Admin que ejecutó el cuadre |
| `estado` | String | `'cuadrado'` o `'con_diferencia'` |
| `notas` | String | Observaciones |
| `numeroRecibo` | String | Identificador único (`RM-<timestamp>`) |
| `periodoDesde` / `periodoHasta` | Date | Rango opcional del período cuadrado |

> Un `noDomi` solo puede aparecer en un `CuadreMensajero`. El endpoint `/registrar` rechaza cualquier domicilio ya cuadrado antes de guardar.

#### AjusteMensajero (adelantos, préstamos y otros ajustes)
| Campo | Tipo | Descripción |
|---|---|---|
| `mensajero` | ObjectId → Mensajero | Mensajero afectado |
| `tipo` | String | `'adelanto'` · `'prestamo'` · `'bonificacion'` · `'descuento'` · `'vuelta_perdida'` |
| `valor` | Number | Monto del ajuste (siempre positivo; el tipo define si suma o resta) |
| `fecha` | Date | Fecha del ajuste |
| `descripcion` | String | Motivo o detalle |
| `estado` | String | `'pendiente'` → `'aplicado'` · `'anulado'` |
| `registradoPor` | ObjectId → Admin | Admin que lo registró |
| `nominaId` | ObjectId → NominaMensajero | Nómina a la que fue aplicado (null si pendiente) |

#### NominaMensajero (nómina de pago)
| Campo | Tipo | Descripción |
|---|---|---|
| `mensajero` | ObjectId → Mensajero | Mensajero liquidado |
| `periodoDesde` / `periodoHasta` | Date | Período de la nómina |
| `domiciliosCompletados` | Number | Domicilios entregados en el período |
| `tarifaPromedio` | Number | Promedio de `pagoMensajero` en el período |
| `totalBruto` | Number | Suma real de `pagoMensajero` de los domis del período |
| `bonificaciones` | Number | Suma de ajustes tipo `bonificacion` aplicados |
| `adelantos` | Number | Suma de ajustes tipo `adelanto` aplicados |
| `prestamos` | Number | Suma de ajustes tipo `prestamo` aplicados |
| `descuentos` | Number | Suma de ajustes tipo `descuento` aplicados |
| `vueltasPerdidas` | Number | Suma de ajustes tipo `vuelta_perdida` aplicados |
| `totalDescuentos` | Number | `adelantos + prestamos + descuentos + vueltasPerdidas` |
| `totalNeto` | Number | `totalBruto + bonificaciones - totalDescuentos` (mínimo 0) |
| `estado` | String | `'pendiente'` · `'pagado'` · `'anulado'` |
| `realizadoPor` | ObjectId → Admin | Admin que generó la nómina |
| `fechaPago` | Date | Fecha en que se marcó como pagada |
| `notas` | String | Observaciones |
| `numeroRecibo` | String | Identificador único (`NOM-<timestamp>`) |
| `ajustesAplicados` | [ObjectId → AjusteMensajero] | Ajustes que se marcaron como `aplicado` al generar esta nómina |

> Índice único en `{ mensajero, periodoDesde, periodoHasta }` (solo entre nóminas no anuladas) para prevenir nóminas duplicadas en el mismo período.

---

### API REST — Endpoints

Todas las rutas protegidas requieren la cookie `token` en la petición.

#### Admin — `/api/admin`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/ingresar-admin` | No | Registrar nuevo administrador |
| POST | `/login` | No | Iniciar sesión (retorna cookie JWT) |
| GET | `/ruta-protegida` | Sí | Obtener perfil del admin autenticado |
| POST | `/logout` | Sí | Cerrar sesión (elimina cookie) |

#### Clientes — `/api/clientes`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/ingresar` | Sí | Crear nuevo cliente |
| GET | `/listar-clientes` | Sí | Obtener lista de todos los clientes |
| GET | `/listar-cliente/:id` | Sí | Obtener un cliente por ID |
| PUT | `/actualizar-cliente/:id` | Sí | Editar datos de un cliente |
| DELETE | `/eliminar-cliente/:id` | Sí | Eliminar un cliente |

#### Mensajeros — `/api/mensajeros`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/ingresar-mensajero` | Sí | Registrar nuevo mensajero |
| GET | `/listar-mensajeros` | Sí | Obtener lista de mensajeros |
| GET | `/listar-mensajero/:id` | Sí | Obtener mensajero por ID |
| PUT | `/editar-mensajero/:id` | Sí | Editar datos de mensajero |
| DELETE | `/eliminar-mensajero/:id` | Sí | Eliminar mensajero |

#### Domicilios — `/api/domis`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/ingresar-domi` | Sí | Crear domicilio (crea cliente si no existe) |
| GET | `/listar-domis` | Sí | Todos los domicilios con populate de cliente y mensajero |
| PUT | `/actualizar-domi/:id` | Sí | Editar datos completos de un domicilio |
| PUT | `/actualizar-estado-domi/:id` | Sí | Cambiar únicamente el estado |
| GET | `/buscar-domi/:id` | Sí | Buscar domicilio con datos básicos |
| DELETE | `/eliminar-domi/:id` | Sí | Eliminar domicilio |

#### Cuadre — `/api/cuadre`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/ingresar` | Sí | Registrar pago de un domicilio y actualizar totales |
| GET | `/listar` | Sí | Listar todos los registros de cuadre individuales |
| GET | `/resumen-clientes` | Sí | Resumen financiero agregado por cliente |
| GET | `/resumen-mensajeros` | Sí | Resumen de domicilios + cuadres por mensajero (aggregation) |
| GET | `/pendientes-clientes` | Sí | Clientes con domicilios entregados aún no cuadrados a nivel de cliente |
| POST | `/registrar-cuadre-cliente` | Sí | Registrar un cuadre cerrado de cliente y generar número de recibo |
| GET | `/historial-cuadres` | Sí | Historial completo de cuadres cerrados por cliente |

#### Cuadre de Mensajeros — `/api/cuadre-mensajero`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| GET | `/pendientes` | Sí | Mensajeros con domicilios entregados aún no cuadrados, agrupados con el listado de domis |
| POST | `/registrar` | Sí | Crear cuadre cerrado; rechaza si algún `noDomi` ya fue cuadrado antes |
| GET | `/historial` | Sí | Todos los cuadres cerrados de mensajeros, del más reciente al más antiguo |
| GET | `/ajustes` | Sí | Listar ajustes (filtrable por `?mensajeroId=` y `?estado=`) |
| POST | `/ajustes` | Sí | Registrar adelanto, préstamo, bonificación, descuento o vuelta perdida |
| PUT | `/ajustes/:id/anular` | Sí | Anular ajuste pendiente (no aplica si ya fue incluido en una nómina) |
| GET | `/nominas` | Sí | Listado completo de nóminas generadas |
| POST | `/nominas/generar` | Sí | Generar nómina: calcula bruto desde domis reales del período, aplica ajustes pendientes |
| PUT | `/nominas/:id/marcar-pagado` | Sí | Marcar nómina como pagada y registrar fecha de pago |
| PUT | `/nominas/:id/anular` | Sí | Anular nómina y revertir sus ajustes a estado `pendiente` |

**Lógica de `POST /nominas/generar`:**
1. Valida que no exista otra nómina activa para el mismo mensajero + período.
2. Consulta en MongoDB todos los domicilios con `estado: 'entregado'` del mensajero en el rango de fechas.
3. Calcula `totalBruto = Σ pagoMensajero` de esos domicilios.
4. Obtiene todos los `AjusteMensajero` con `estado: 'pendiente'` para ese mensajero.
5. Suma por tipo: bonificaciones, adelantos, préstamos, descuentos, vueltas perdidas.
6. `totalNeto = totalBruto + bonificaciones - (adelantos + préstamos + descuentos + vueltas)`, mínimo 0.
7. Guarda la nómina y marca todos los ajustes pendientes como `aplicado`, enlazándolos al `nominaId`.

#### Dashboard — `/api/dashboard`

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| GET | `/resumen?periodo=hoy\|semana\|mes` | Sí | KPIs, gráficos, alertas y actividad reciente del período seleccionado |

**Respuesta de `/api/dashboard/resumen`:**
```json
{
  "kpis": {
    "totalDomis":  { "valor": 45, "cambio": 12.5 },
    "entregados":  { "valor": 38, "cambio": 8.2 },
    "pendientes":  { "valor": 5,  "cambio": -3.1 },
    "rechazados":  { "valor": 2,  "cambio": 0 },
    "ingresos":    { "valor": 580000, "cambio": 15.3 },
    "porCobrar":   { "valor": 120000, "cambio": 0 },
    "tasaEntrega": { "valor": 84.4, "cambio": 2.1 },
    "promedio":    { "valor": 15263, "cambio": -1.2 }
  },
  "graficos": {
    "evolucionDiaria":    [{ "fecha": "2025-01-15", "total": 8, "entregados": 6, "rechazados": 1, "pendientes": 1 }],
    "distribucionEstado": [{ "name": "Entregados", "value": 38, "color": "#22c55e" }],
    "mensajeros":         [{ "nombre": "Juan", "entregados": 12, "pendientes": 2, "rechazados": 1 }],
    "topClientes":        [{ "empresa": "XYZ", "total": 8, "entregados": 7, "valor": 120000 }]
  },
  "alertas": {
    "clientesPendientes": 3,
    "rechazadosHoy": 1,
    "mensajerosConPendientes": 2
  },
  "actividadReciente": [
    { "noDomi": "abc123", "cliente": "XYZ", "mensajero": "Juan", "estado": "entregado", "valorDomi": 15000, "fecha": "..." }
  ]
}
```

**Lógica del endpoint (`dashboardController.js`):**
- Ejecuta 3 queries en paralelo con `Promise.all` para minimizar latencia.
- Calcula `cambio` (% vs período anterior) para cada KPI.
- `porCobrar`: suma de `valorDomi` de domicilios entregados cuyo `noDomi` no aparece en ningún `CuadreCliente`.
- `clientesPendientes` en alertas: número de clientes distintos con domicilios sin cuadrar.
- Los datos de gráficos (evolución, mensajeros, clientes) se computan en memoria JS a partir del resultado de las queries, sin agregaciones adicionales de MongoDB.

---

### Autenticación

1. El admin envía `{ usuario, password }` a `POST /api/admin/login`.
2. El servidor verifica la contraseña con `bcrypt.compare`.
3. Si es correcta, genera un JWT firmado con `JWT_SECRET` (expiración: 30 días) y lo guarda en una cookie `httpOnly` llamada `token`.
4. En cada petición protegida, el middleware `checkAuth` lee `req.cookies.token`, lo verifica con `jwt.verify`, y adjunta el admin a `req.admin`.
5. Al cerrar sesión, el servidor elimina la cookie con `res.clearCookie('token')`.

**CORS habilitado para:** `http://localhost:4000`, `http://localhost:5173`, `http://localhost:5174`

---

### Lógica de negocio

**Creación de domicilio (`POST /api/domis/ingresar-domi`):**
- Si se envía `cliente` (ObjectId): se usa el cliente existente.
- Si no se envía `cliente`: se crea un nuevo Cliente con `{ nombres, empresa, direccion, telefono }` y se asigna al domicilio.
- Al crear el domicilio, se actualiza automáticamente el Mensajero: `+1 totalDomis`, `+1 totalDomisPendientes`, `+pagoMensajero en totalGanancia`, `- pagoMensajero en diferencia`.

**Listado de domicilios (`GET /api/domis/listar-domis`):**
- Usa `.populate('cliente', ...)` y `.populate('mensajero', ...)` para resolver las referencias en una sola consulta.
- Evita el problema N+1: el frontend recibe los datos ya resueltos sin necesitar llamadas adicionales por fila.

**Conversión de ruta:**
El frontend envía `'1'`, `'2'` o `'3'`. El backend lo convierte a texto usando `rutaMap`:
```js
{ 1: 'mañana', 2: 'tarde', 3: 'noche' }
```

**Pago al mensajero:**
El frontend calcula automáticamente `pagoMensajero = valorDomi × 0.70` (70%) al ingresar el valor del domicilio.

**Cuadre individual de domicilio (`POST /api/cuadre/ingresar`):**
- `recibidoPor: 'Mensajero'` → actualiza `totalRecibido` y `diferencia` del mensajero.
- `recibidoPor: 'Cliente'` → registra ingreso directo del cliente (cobro en destino).
- Actualiza los agregados financieros del Cliente: `totalDomis`, `valorJS`, `valorCliente`, `totalValorEsperado`, `diferenciaJS`.
- Reduce `totalDomisPendientes` e incrementa `totalDomisCompletados` del Mensajero.
- Si el domicilio ya tiene un cuadre registrado, lo actualiza en vez de crear uno nuevo.

**Cuadre de cliente (`POST /api/cuadre/registrar-cuadre-cliente`):**
- `totalEsperado` se calcula en el backend como la suma de `valorDomi` de los domicilios donde `recibidoPor === 'Cliente'` en el `Cuadre` individual. Los pagos recibidos por mensajero o por JS Logistics **no se cobran al cliente**.
- `diferencia = totalRecibido - totalEsperado` (negativo = faltante, positivo = excedente).
- `estado` se asigna automáticamente: `'cuadrado'` si la diferencia es ≥ 0, `'con_diferencia'` si es negativa.
- Se genera un `numeroRecibo` único con el patrón `RC-<timestamp>`.
- Se registra el admin que realizó el cuadre (`realizadoPor = req.admin._id`).

**Lógica de domicilios pendientes de cuadre (`GET /api/cuadre/pendientes-clientes`):**
1. Se obtienen todos los `CuadreCliente` existentes y se recopilan los `noDomi` ya incluidos en algún cuadre.
2. Se traen todos los domicilios con `estado: 'entregado'` y se filtran los que NO están en ningún cuadre previo.
3. Se cruzan con la colección `Cuadre` para saber quién recibió cada pago.
4. Se agrupan por cliente. Por cada domicilio se indica `recibidoPor` y `cobrableAlCliente` (solo `true` cuando `recibidoPor === 'Cliente'`).
5. `totalEsperado` del grupo solo acumula los domicilios cobrables al cliente.
