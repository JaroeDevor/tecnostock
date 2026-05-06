# Guía Final de Despliegue: TecnoStock

¡Tu código ya está seguro en GitHub! Ahora vamos a ponerlo en línea de forma gratuita. Hazlo en este orden exacto: primero el Backend (servidor) y luego el Frontend (lo visual).

## Fase 1: El Backend (Render)

1. Entra a **[Render.com](https://render.com/)** e inicia sesión con tu GitHub.
2. Haz clic en **New +** (arriba a la derecha) y elige **Web Service**.
3. Elige la opción **"Build and deploy from a Git repository"** y dale a Next.
4. Busca en la lista tu repositorio `JaroeDevor/tecnostock` y dale al botón **Connect**.
5. Completa el formulario exactamente así:
   - **Name**: `tecnostock-api` (o el que quieras)
   - **Root Directory**: `server` *(¡Súper importante!)*
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free (Gratis)
6. Baja un poco hasta la sección **Environment Variables** (Variables de Entorno) y haz clic en "Add Environment Variable". Debes agregar estas tres (copia y pega):
   - Key: `DATABASE_URL` | Value: *(Pega aquí todo el link larguísimo de Neon que usamos antes)*
   - Key: `JWT_SECRET` | Value: `tecnostock_jwt_secret_key_2026_tecnomovil`
   - Key: `ENCRYPTION_KEY` | Value: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
7. Baja del todo y dale a **Create Web Service**. 
8. Render empezará a cargar en una consola negra. Cuando termine y diga "Live", verás un link arriba a la izquierda (ej: `https://tecnostock-api.onrender.com`). **Copia esa URL**, la necesitamos para el siguiente paso.

---

## Fase 2: El Frontend (Vercel)

1. Entra a **[Vercel.com](https://vercel.com/)** e inicia sesión con tu GitHub.
2. Haz clic en el botón negro **Add New...** y luego en **Project**.
3. En la lista, busca tu repositorio `tecnostock` y haz clic en **Import**.
4. En el panel de configuración (antes de darle a Deploy), haz esto:
   - Abre la pestaña **Root Directory**. Haz clic en Edit y selecciona la carpeta `client`.
   - Abre la pestaña **Environment Variables**. Agrega una nueva:
     - Name: `VITE_API_URL`
     - Value: *(Pega aquí el link que te dio Render en el paso anterior y agrégale `/api` al final. Tiene que quedar algo así: `https://tecnostock-api.onrender.com/api`)*
5. Haz clic en el botón azul **Deploy**.
6. Vercel empezará a construir tu sitio. ¡En menos de un minuto te mostrará confeti 🎉 y te dará tu enlace web final!

> **Nota:** Render "duerme" los servidores gratuitos tras 15 minutos sin uso. Si entras a tu portafolio y el login tarda un poco en cargar la primera vez, es normal, el servidor se está "despertando" (suele tardar de 30 a 50 segundos).
