# TecnoStock - Inventory & POS SaaS

TecnoStock es un sistema de gestión de inventarios y punto de venta (POS) escalable y moderno diseñado para facilitar operaciones en múltiples depósitos y tiendas físicas.

## Stack Tecnológico

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (via Prisma ORM)

## Características Principales

- **Gestión Multi-Ubicación:** Control de stock separado por depósito o tienda comercial.
- **Punto de Venta (POS):** Carrito de compras veloz integrado con el inventario físico y validación en tiempo real.
- **Órdenes de Compra:** Flujo de adquisiciones desde la creación (DRAFT) hasta la recepción (COMPLETE) y costeo (Promedio Ponderado).
- **Reportes Financieros:** Cálculo de rentabilidad real que toma en cuenta el costo exacto al momento de cada venta.
- **Integraciones Ómnicanal:** Base preparada para conexiones con MercadoLibre y TiendaNube.
- **Diseño Premium:** Interfaz oscura, moderna, responsive, y optimizada para uso ágil con atajos visuales y notificaciones.

## Instalación y Configuración

### Backend

1. Navegar a la carpeta del servidor:
   ```bash
   cd server
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (`.env`):
   Asegúrate de que haya un archivo `.env` en la carpeta `server` con lo siguiente:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="alguna_clave_secreta"
   PORT=3001
   ```
4. Aplicar la migración y seed inicial de la DB:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
5. Iniciar el servidor:
   ```bash
   npm run dev
   ```

### Frontend

1. Navegar a la carpeta del cliente:
   ```bash
   cd client
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar entorno de desarrollo:
   ```bash
   npm run dev
   ```

Visita `http://localhost:5173` para usar el sistema.

### Credenciales de Prueba

El comando `npm run seed` insertará algunos usuarios por defecto:

- **Admin:** `admin@tecnomovil.com` / `123456`
- **Gerente:** `gerente@tecnomovil.com` / `123456`
- **Vendedor:** `vendedor@tecnomovil.com` / `123456`
