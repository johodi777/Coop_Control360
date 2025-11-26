# CoopControl 360 - Frontend

Panel Administrativo de CoopControl 360 desarrollado con React + Vite.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Router DOM** - Enrutamiento
- **Tailwind CSS** - Estilos
- **Zustand** - Gestión de estado
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Lucide React** - Iconos

## 📦 Instalación

```bash
cd frontend
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se ejecutará en `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
src/
├── api/              # Servicios API
├── components/       # Componentes reutilizables
│   ├── layout/      # Layout principal
│   ├── ui/          # Componentes UI base
│   └── charts/      # Componentes de gráficos
├── context/         # Stores (Zustand)
├── modules/         # Módulos de la aplicación
│   ├── affiliates/  # Módulo de Afiliados
│   │   ├── components/  # Componentes JSX
│   │   ├── styles/      # Estilos CSS
│   │   └── hooks/       # Hooks y lógica JS
│   ├── payments/    # Módulo de Pagos
│   │   ├── components/
│   │   ├── styles/
│   │   └── hooks/
│   └── services/    # Módulo de Servicios
│       ├── components/
│       ├── styles/
│       └── hooks/
├── pages/           # Páginas de la aplicación
└── router/          # Configuración de rutas
```

## 🎨 Branding

- **Primary**: #3A0DFF
- **Secondary**: #FF6A32
- **Dark**: #0F0F16
- **Panel**: #1A1A22

## 📝 Notas

- El frontend está configurado para conectarse al backend en `http://localhost:4000`
- Las rutas están protegidas con autenticación
- El token se almacena en localStorage
- El proxy de Vite redirige `/api` a `http://localhost:4000/api`

## 🔐 Credenciales por Defecto

- **Email**: `admin@coopcontrol.com`
- **Contraseña**: `admin123`

## ✨ Características

- ✅ Diseño SaaS moderno y profesional
- ✅ Tema oscuro con colores del branding
- ✅ Dashboard interactivo con gráficos
- ✅ Navegación fluida con React Router
- ✅ Autenticación con JWT
- ✅ Gestión de estado con Zustand
- ✅ Componentes reutilizables
- ✅ Responsive design
- ✅ Iconos con Lucide React
- ✅ Gráficos con Recharts

## 🐛 Solución de Problemas

### Error de conexión al backend
Asegúrate de que el backend esté corriendo en el puerto 4000:
```bash
cd ../backend
npm run dev
```

### Error de CORS
El backend ya tiene CORS configurado. Si persiste, verifica que el backend esté corriendo.

