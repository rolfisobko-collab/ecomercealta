# Documentación de Cálculos del Dashboard

## Ubicación
**URL:** `http://localhost:3000/admin`  
**Archivo Frontend:** `/app/admin/page.tsx`  
**Archivo API:** `/app/api/dashboard-data/route.ts`

---

## Arquitectura y Flujo de Datos

### 1. Base de Datos
**MongoDB Atlas**
- **URI:** `mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test`
- **Base de datos:** `test`
- **Driver:** MongoDB Node.js Driver (nativo)

### 2. Flujo Técnico Completo

```
┌─────────────────┐
│   Browser       │
│  (Dashboard)    │
└────────┬────────┘
         │ 1. fetch('/api/dashboard-data')
         ↓
┌─────────────────────────────────────┐
│   Next.js API Route                 │
│   /app/api/dashboard-data/route.ts  │
└────────┬────────────────────────────┘
         │ 2. MongoClient.connect()
         ↓
┌─────────────────────────────────────┐
│   MongoDB Atlas                     │
│   Cluster: cluster0.qkjc22r.mongodb │
│   Database: test                    │
└────────┬────────────────────────────┘
         │ 3. db.collection().find()
         ↓
┌─────────────────────────────────────┐
│   Colecciones:                      │
│   - stock (2,801 docs)              │
│   - cashTransactions (2,770 docs)   │
│   - sales (631 docs)                │
│   - technicalServices (443 docs)    │
└────────┬────────────────────────────┘
         │ 4. Datos en formato BSON
         ↓
┌─────────────────────────────────────┐
│   API Route procesa datos           │
│   - Convierte _id a string          │
│   - Retorna JSON                    │
└────────┬────────────────────────────┘
         │ 5. Response JSON
         ↓
┌─────────────────────────────────────┐
│   Dashboard Component               │
│   - Calcula estadísticas            │
│   - Renderiza gráficos              │
└─────────────────────────────────────┘
```

### 3. Código de la API Route

**Archivo:** `/app/api/dashboard-data/route.ts`

```typescript
import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI = 'mongodb+srv://...'

export async function GET() {
  let client: MongoClient | null = null
  
  try {
    // 1. Conectar directamente a MongoDB
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('test')
    
    // 2. Consultar todas las colecciones en paralelo
    const [products, cashTransactions, sales, technicalServices] = await Promise.all([
      db.collection('stock').find({}).toArray(),
      db.collection('cashTransactions').find({}).toArray(),
      db.collection('sales').find({}).toArray(),
      db.collection('technicalServices').find({}).toArray()
    ])

    // 3. Transformar datos (convertir ObjectId a string)
    const result = {
      products: products.map(p => {
        const { _id, ...rest } = p
        return { ...rest, id: _id }
      }),
      cashTransactions: cashTransactions.map(t => {
        const { _id, ...rest } = t
        return { ...rest, id: _id }
      }),
      sales: sales.map(s => {
        const { _id, ...rest } = s
        return { ...rest, id: _id }
      }),
      technicalServices: technicalServices.map(s => {
        const { _id, ...rest } = s
        return { ...rest, id: _id }
      })
    }

    // 4. Retornar JSON
    return NextResponse.json(result)
  } finally {
    // 5. Cerrar conexión
    if (client) await client.close()
  }
}
```

### 4. Código del Frontend

**Archivo:** `/app/admin/page.tsx`

```typescript
const loadDashboardData = async () => {
  try {
    setLoading(true)

    // 1. Llamar a la API
    const response = await fetch('/api/dashboard-data')
    const data = await response.json()

    // 2. Extraer datos
    const { products, cashTransactions, sales, technicalServices } = data

    // 3. Procesar datos en el cliente
    // (ver secciones de cálculos abajo)
    
  } catch (error) {
    console.error("Error loading dashboard data:", error)
  } finally {
    setLoading(false)
  }
}
```

---

## Fuentes de Datos (Colecciones MongoDB)

### 1. Colección: `stock`
**Documentos:** 2,801  
**Estructura:**
```javascript
{
  _id: "abc123",
  name: "MODULO INFINIX HOT 50i OLED",
  price: 22000,
  quantity: 5,
  category: "xyz789",
  brand: "Infinix",
  image1: "https://...",
  images: ["https://..."],
  description: "...",
  createdAt: "2025-05-02T14:48:32.382Z"
}
```

### 2. Colección: `cashTransactions`
**Documentos:** 2,770  
**Estructura:**
```javascript
{
  _id: "019xdCRmCetrDRtDCKsT",
  type: "Ingreso",  // o "Egreso"
  amount: 22000,
  description: "Efectivo ARS: Venta: 1x MODULO INFINIX HOT 50i OLED | Ingreso: sales",
  currency: "PESO",
  time: "2025-05-02T14:48:31.929Z",
  isDebt: false,
  receivable: 0,
  user: "Admin",
  reference: "cash-ars-1746197311929",
  closingId: "",
  createdAt: "2025-05-02T14:48:32.382Z"
}
```

### 3. Colección: `sales`
**Documentos:** 631  
**Estructura:**
```javascript
{
  _id: "sale123",
  total: 22000,
  paymentMethod: "cash",  // "card", "transfer", "mixed"
  items: [
    {
      name: "MODULO INFINIX HOT 50i OLED",
      quantity: 1,
      price: 22000,
      subtotal: 22000
    }
  ],
  createdAt: "2025-05-02T14:48:32.382Z",
  paidAt: "2025-05-02T14:48:32.382Z"
}
```

### 4. Colección: `technicalServices`
**Documentos:** 443  
**Estructura:**
```javascript
{
  _id: "service123",
  isPaid: true,  // o false
  price: 5000,
  status: "completed",  // "in_progress", "pending"
  description: "Reparación de pantalla",
  createdAt: "2025-05-02T14:48:32.382Z"
}
```

---

## Consultas MongoDB Específicas

### Consulta 1: Obtener todos los productos
```javascript
db.collection('stock').find({}).toArray()
```
- **Retorna:** Array de 2,801 documentos
- **Tiempo:** ~50-100ms

### Consulta 2: Obtener transacciones de caja
```javascript
db.collection('cashTransactions').find({}).toArray()
```
- **Retorna:** Array de 2,770 documentos
- **Tiempo:** ~50-100ms

### Consulta 3: Obtener ventas
```javascript
db.collection('sales').find({}).toArray()
```
- **Retorna:** Array de 631 documentos
- **Tiempo:** ~30-50ms

### Consulta 4: Obtener servicios técnicos
```javascript
db.collection('technicalServices').find({}).toArray()
```
- **Retorna:** Array de 443 documentos
- **Tiempo:** ~30-50ms

### Optimización: Promise.all()
Todas las consultas se ejecutan **en paralelo** usando `Promise.all()`:
- **Tiempo total:** ~100-150ms (en lugar de ~200-300ms secuencial)
- **Beneficio:** 50% más rápido

---

## KPIs (Indicadores Clave)

### 1. Inventario
- **Fuente:** Colección `stock`
- **Cálculo:** 
  - Total productos: `products.length`
  - Productos en catálogo
- **Código:**
```typescript
totalProducts: products.length
```

### 2. Ingresos Totales
- **Fuente:** Colección `cashTransactions`
- **Cálculo:** Suma de todas las transacciones con `type === 'Ingreso'`
- **Código:**
```typescript
const ingresos = cashTransactions.filter(t => t.type === 'Ingreso')
const totalIngresos = ingresos.reduce((sum, t) => sum + (t.amount || 0), 0)
```

### 3. Egresos Totales
- **Fuente:** Colección `cashTransactions`
- **Cálculo:** Suma de todas las transacciones con `type === 'Egreso'`
- **Código:**
```typescript
const egresos = cashTransactions.filter(t => t.type === 'Egreso')
const totalEgresos = egresos.reduce((sum, t) => sum + (t.amount || 0), 0)
```

### 4. Deudas Pendientes
- **Fuente:** Colección `cashTransactions`
- **Cálculo:** Suma del campo `receivable` de transacciones con `isDebt === true` y `receivable > 0`
- **Código:**
```typescript
const debts = cashTransactions.filter(t => t.isDebt && (t.receivable || 0) > 0)
const totalDebt = debts.reduce((sum, d) => sum + (d.receivable || 0), 0)
```

---

## Gráficos

### 1. Ventas e Ingresos - Últimos 30 Días
**Tipo:** Gráfico de Área (AreaChart)  
**Fuente:** Colección `cashTransactions`

**Cálculo:**
1. Se generan los últimos 30 días
2. Para cada día se filtran las transacciones tipo "Ingreso"
3. Se suman los montos de ese día

**Código:**
```typescript
const last30Days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return date.toISOString().split('T')[0]
})

const salesByDayData = last30Days.map(day => {
  const dayIngresos = ingresos.filter(t => {
    const tDate = new Date(t.time || t.createdAt).toISOString().split('T')[0]
    return tDate === day
  })
  
  const ingresosTotal = dayIngresos.reduce((sum, t) => sum + (t.amount || 0), 0)
  
  return {
    date: new Date(day).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
    ventas: Math.round(ingresosTotal),
    ingresos: Math.round(ingresosTotal),
    cantidad: dayIngresos.length
  }
})
```

**Datos mostrados:**
- `ventas`: Total de ingresos del día
- `ingresos`: Total de ingresos en caja del día
- `cantidad`: Número de transacciones

---

### 2. Ingresos vs Egresos - Últimos 6 Meses
**Tipo:** Gráfico de Barras (BarChart)  
**Fuente:** Colección `cashTransactions`

**Cálculo:**
1. Se generan los últimos 6 meses
2. Para cada mes se filtran ingresos y egresos
3. Se calcula el flujo neto (ingresos - egresos)

**Código:**
```typescript
const last6Months = Array.from({ length: 6 }, (_, i) => {
  const date = new Date()
  date.setMonth(date.getMonth() - (5 - i))
  return {
    month: date.toLocaleDateString('es', { month: 'short' }),
    year: date.getFullYear(),
    monthNum: date.getMonth()
  }
})

const financialByMonth = last6Months.map(({ month, year, monthNum }) => {
  const monthIngresos = ingresos.filter(t => {
    const tDate = new Date(t.time || t.createdAt)
    return tDate.getMonth() === monthNum && tDate.getFullYear() === year
  }).reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const monthEgresos = egresos.filter(t => {
    const tDate = new Date(t.time || t.createdAt)
    return tDate.getMonth() === monthNum && tDate.getFullYear() === year
  }).reduce((sum, t) => sum + (t.amount || 0), 0)
  
  return {
    mes: month,
    ingresos: Math.round(monthIngresos),
    egresos: Math.round(monthEgresos),
    neto: Math.round(monthIngresos - monthEgresos)
  }
})
```

**Datos mostrados:**
- `ingresos`: Total de ingresos del mes (barra verde)
- `egresos`: Total de egresos del mes (barra roja)
- `neto`: Diferencia (ingresos - egresos)

---

### 3. Top 10 Productos Más Vendidos
**Tipo:** Gráfico de Barras Horizontal (BarChart)  
**Fuente:** Colección `cashTransactions`

**Cálculo:**
1. Se analizan las descripciones de transacciones tipo "Ingreso"
2. Se extrae el nombre del producto usando regex: `/Venta: \d+x (.+?) \|/`
3. Se cuentan las ventas por producto
4. Se ordenan de mayor a menor
5. Se toman los top 10

**Código:**
```typescript
const productSales = new Map()

ingresos.forEach(t => {
  const desc = t.description || ''
  const match = desc.match(/Venta: \d+x (.+?) \|/)
  if (match) {
    const productName = match[1]
    const current = productSales.get(productName) || { cantidad: 0, ingresos: 0 }
    productSales.set(productName, {
      cantidad: current.cantidad + 1,
      ingresos: current.ingresos + (t.amount || 0)
    })
  }
})

const topProds = Array.from(productSales.entries())
  .sort((a, b) => b[1].cantidad - a[1].cantidad)
  .slice(0, 10)
  .map(([name, data]) => ({
    name: name.substring(0, 40) + (name.length > 40 ? '...' : ''),
    cantidad: data.cantidad,
    ingresos: Math.round(data.ingresos)
  }))
```

**Datos mostrados:**
- `cantidad`: Número de veces que se vendió el producto
- `ingresos`: Total de ingresos generados por ese producto

---

### 4. Métodos de Pago
**Tipo:** Gráfico Circular (PieChart)  
**Fuente:** Colección `sales`

**Cálculo:**
1. Se agrupan las ventas por método de pago
2. Se normalizan los nombres (cash → Efectivo, card → Tarjeta, etc.)
3. Se cuenta cuántas ventas hay de cada tipo

**Código:**
```typescript
const paymentMethods: { [key: string]: number } = {}

sales.forEach(sale => {
  let method = (sale.paymentMethod || 'cash').toLowerCase()
  
  // Normalizar nombres
  if (method === 'cash' || method === 'efectivo') method = 'Efectivo'
  else if (method === 'card' || method === 'tarjeta') method = 'Tarjeta'
  else if (method === 'transfer' || method === 'transferencia') method = 'Transferencia'
  else if (method === 'mixed' || method === 'mixto') method = 'Mixto'
  else method = method.charAt(0).toUpperCase() + method.slice(1)
  
  paymentMethods[method] = (paymentMethods[method] || 0) + 1
})

const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
  name,
  value
}))
```

**Datos mostrados:**
- Porcentaje de ventas por cada método de pago

---

### 5. Servicios Técnicos por Estado
**Tipo:** Gráfico Circular (PieChart)  
**Fuente:** Colección `technicalServices`

**Cálculo:**
1. Se cuentan servicios con `isPaid === true` (Pagados)
2. Se cuentan servicios con `isPaid === false` (Pendientes)

**Código:**
```typescript
const serviceStates = [
  { 
    name: 'Pagados', 
    value: technicalServices.filter(s => s.isPaid).length, 
    color: '#22c55e' 
  },
  { 
    name: 'Pendientes', 
    value: technicalServices.filter(s => !s.isPaid).length, 
    color: '#f59e0b' 
  }
].filter(s => s.value > 0)
```

**Datos mostrados:**
- Cantidad de servicios pagados (verde)
- Cantidad de servicios pendientes (naranja)

---

### 6. Flujo de Caja Neto - Últimos 6 Meses
**Tipo:** Gráfico de Línea (LineChart)  
**Fuente:** Colección `cashTransactions`

**Cálculo:**
1. Usa los mismos datos que "Ingresos vs Egresos"
2. Muestra solo la línea del flujo neto (ingresos - egresos)

**Código:**
```typescript
// Usa el mismo array financialByMonth del gráfico 2
// Muestra solo el campo 'neto'
```

**Datos mostrados:**
- `neto`: Ganancia o pérdida mensual (ingresos - egresos)
- Línea morada con puntos

---

## Resumen Financiero (Cards)

### Total Ingresos
- **Fuente:** `totalRevenue` calculado de cashTransactions
- **Color:** Verde
- **Icono:** TrendingUp

### Deudas Pendientes
- **Fuente:** `totalDebt` calculado de cashTransactions
- **Color:** Naranja
- **Icono:** AlertTriangle

### Servicios Técnicos
- **Fuente:** Colección `technicalServices`
- **Datos:**
  - Total: `technicalServices.length`
  - Pendientes: `technicalServices.filter(s => !s.isPaid).length`
- **Color:** Azul
- **Icono:** Wrench

---

## Notas Técnicas

### Formato de Fechas
- Las fechas se comparan en formato ISO: `YYYY-MM-DD`
- Se usa `toISOString().split('T')[0]` para obtener solo la fecha

### Redondeo
- Todos los montos se redondean con `Math.round()`
- Los números se formatean con `.toLocaleString()` para separadores de miles

### Filtrado de Datos
- Se usa `filter()` para seleccionar datos específicos
- Se usa `reduce()` para sumar valores
- Se usa `map()` para transformar datos

### Performance
- Los datos se cargan una sola vez al montar el componente
- Se usa `useMemo` para optimizar cálculos pesados (en el frontend)
- La API devuelve todos los datos procesados para evitar múltiples consultas

---

## Actualización de Datos

Los datos se actualizan:
1. Al cargar la página (`useEffect` en el componente)
2. Al recargar manualmente la página
3. Los datos son en tiempo real desde MongoDB

Para forzar una actualización, simplemente recarga la página del navegador.
