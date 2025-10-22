# Guía de Migración: Firebase a MongoDB Atlas

Este proyecto ha sido migrado de Firebase a MongoDB Atlas para mejorar el rendimiento y la escalabilidad.

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://leandrosobko_db_user:<db_password>@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=mobile-repair-ecommerce

# Configuración de Base de Datos (mongodb o firebase)
DATABASE_PROVIDER=mongodb

# Firebase Configuration (mantener para migración)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=altatelefonia-1e51b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=altatelefonia-1e51b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=altatelefonia-1e51b.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=724944708673
NEXT_PUBLIC_FIREBASE_APP_ID=1:724944708673:web:874804815a39987d5652c0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V8DG4G138Z
```

### 2. Instalar Dependencias

```bash
pnpm install
```

## 📦 Estructura de la Migración

### Servicios Híbridos

El proyecto ahora incluye servicios híbridos que pueden usar tanto Firebase como MongoDB:

- `services/hybrid/` - Servicios que alternan entre Firebase y MongoDB
- `services/mongodb/` - Servicios específicos para MongoDB
- `services/api/` - Servicios originales de Firebase (mantenidos para compatibilidad)

### Modelos de MongoDB

- `models/mongodb/` - Esquemas de Mongoose equivalentes a los modelos de Firebase
- `lib/mongodb.ts` - Configuración de MongoDB
- `lib/mongoose.ts` - Configuración de Mongoose

## 🔄 Proceso de Migración

### 1. Ejecutar Migración

```bash
# Opción 1: Usar el script wrapper
pnpm run migrate

# Opción 2: Ejecutar directamente
pnpm run migrate:direct
```

### 2. Verificar Migración

El script de migración:
- ✅ Conecta a MongoDB Atlas
- ✅ Limpia las colecciones existentes
- ✅ Migra usuarios
- ✅ Migra categorías
- ✅ Migra productos
- ✅ Migra proveedores
- ✅ Migra movimientos
- ✅ Migra favoritos
- ✅ Migra servicios técnicos
- ✅ Migra transacciones
- ✅ Migra cierres de caja

### 3. Cambiar a MongoDB

Una vez completada la migración, cambia la variable de entorno:

```env
DATABASE_PROVIDER=mongodb
```

## 🛠️ Configuración de Base de Datos

### MongoDB Atlas

1. **Conexión**: El string de conexión ya está configurado
2. **Base de datos**: `mobile-repair-ecommerce`
3. **Colecciones**:
   - `users` - Usuarios del sistema
   - `stock` - Productos/inventario
   - `stockCategories` - Categorías de productos
   - `suppliers` - Proveedores
   - `movements` - Movimientos de stock
   - `favorites` - Productos favoritos
   - `technicalServices` - Servicios técnicos
   - `transactions` - Transacciones de caja
   - `cashClosings` - Cierres de caja

### Índices Optimizados

MongoDB incluye índices optimizados para:
- Búsquedas de texto completo
- Consultas por categoría
- Filtros por estado
- Ordenamiento por fecha

## 🔧 Uso de los Servicios

### Servicios Híbridos

Los servicios híbridos detectan automáticamente qué base de datos usar:

```typescript
import { getUsers } from '@/services/hybrid/userService'
import { getAllProducts } from '@/services/hybrid/productService'
import { getAllCategories } from '@/services/hybrid/categoryService'

// Estos servicios usan MongoDB o Firebase según la configuración
const users = await getUsers()
const products = await getAllProducts()
const categories = await getAllCategories()
```

### Cambio de Base de Datos

Para cambiar entre Firebase y MongoDB, solo cambia la variable de entorno:

```env
# Para usar MongoDB
DATABASE_PROVIDER=mongodb

# Para usar Firebase (rollback)
DATABASE_PROVIDER=firebase
```

## 🚨 Consideraciones Importantes

### 1. Compatibilidad

- ✅ Todas las APIs del frontend siguen funcionando igual
- ✅ No se requieren cambios en los componentes
- ✅ Los tipos de datos son idénticos

### 2. Rendimiento

- 🚀 MongoDB Atlas ofrece mejor rendimiento para consultas complejas
- 🚀 Índices optimizados para búsquedas
- 🚀 Escalabilidad horizontal

### 3. Tiempo Real

- ⚠️ MongoDB no tiene listeners en tiempo real como Firebase
- ⚠️ Se implementó caché local para simular el comportamiento
- ⚠️ Considera usar MongoDB Change Streams para tiempo real

## 🔍 Verificación Post-Migración

### 1. Verificar Datos

```bash
# Conectar a MongoDB y verificar colecciones
mongosh "mongodb+srv://leandrosobko_db_user:<password>@cluster0.qkjc22r.mongodb.net/mobile-repair-ecommerce"
```

### 2. Probar Funcionalidades

- ✅ Login de usuarios
- ✅ Listado de productos
- ✅ Búsqueda de productos
- ✅ Gestión de categorías
- ✅ Sistema de favoritos
- ✅ Gestión de inventario

### 3. Monitoreo

- 📊 Verificar logs de la aplicación
- 📊 Monitorear rendimiento de consultas
- 📊 Verificar uso de memoria

## 🆘 Rollback

Si necesitas volver a Firebase:

1. Cambia la variable de entorno:
   ```env
   DATABASE_PROVIDER=firebase
   ```

2. Reinicia la aplicación:
   ```bash
   pnpm run dev
   ```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Verifica las variables de entorno
2. Confirma la conexión a MongoDB Atlas
3. Revisa los logs de la aplicación
4. Verifica que todos los datos se migraron correctamente

---

**¡Migración completada exitosamente!** 🎉

