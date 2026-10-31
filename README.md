# DurazBer — Frontend 3D & PWA 🍑✨

Interfaz interactiva 3D y Aplicación Web Progresiva (PWA) de **DurazBer (Berni Come Durazno)** para el seguimiento diario de consumo de duraznos en tiempo real, cálculo nutricional exacto sobre fruta fresca de 150g y analítica comparativa de 3 meses.

🌐 **Demo en Vivo (Vercel):** [https://duraz-ber.vercel.app](https://duraz-ber.vercel.app)  
🔗 **Backend API (Render):** [https://durazber-back.onrender.com](https://durazber-back.onrender.com)

---

## 🌟 Características Principales

- **Visor 3D Botánico 360° en Tiempo Real (Three.js WebGL):**
  - **ENTERO:** Morfología botánica orgánica con cavidad peduncular, sutura carpelar, textura procedural aterciopelada y gotas de rocío optimizadas a 60 FPS.
  - **CAROZO:** Corte transversal con mesocarpo jugoso (pulpa radiada) y endocarpo esculpido (carozo 3D con surcos profundos).
  - **DUAL:** Comparativa simultánea de fruta entera y corte transversal en el mismo espacio 3D.
  - **Control Táctil y Mouse Limpio:** Rotación libre de 360° con 1 dedo o mouse, zoom con pellizco (_pinch-to-zoom_) o rueda exclusivamente dentro del lienzo 3D, selector rápido de 6 ángulos y pausa automática de GPU cuando el visor no está en pantalla (`IntersectionObserver`).
- **App Nativa Instalable (PWA iOS, Android y Desktop):**
  - Incluye `manifest.webmanifest` y Service Worker (`sw.js`) con caché inteligente para carga instantánea.
  - Botón directo **"Instalar App"** en la barra superior y en Perfil, con guía paso a paso integrada para Safari en iPhone/iPad (_Compartir → Agregar a inicio_).
- **Experiencia 100% Optimizada para Celular (iOS & Android):**
  - Prevención total de auto-zoom en inputs de iOS Safari (`16px`), bloqueo de zoom por doble toque en botones de conteo (`touch-action: manipulation`) y soporte completo de `safe-area-inset` para iPhone con Notch / Dynamic Island.
- **Contador Diario en Tiempo Real (Cero Recargas):**
  - Botones de acción rápida (`+1`, `+2`, `-1`) con actualización optimista inmediata y cola secuencial de peticiones que evita condiciones de carrera.
  - Sincronización automática de **Historial** y **Analítica** al modificar el contador o al volver a abrir la app (`visibilitychange` / `focus`).
- **Nutrición Real (Base 150g por unidad):**
  - Cálculo dinámico de **63 kcal**, **2.3g de fibra**, **17% VD de Vitamina C** y **134ml de bio-hidratación** por cada durazno registrado.
- **Analítica Rodante de 3 Meses y Exportación CSV:**
  - Gráfico semanal de cumplimiento de meta, comparativa trimestral y descarga directa del historial completo en `.CSV`.

---

## 🛠️ Stack Tecnológico

- **Framework UI:** [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Motor Gráfico 3D:** [Three.js (`^0.170.0`)](https://threejs.org/)
- **Estilos y Diseño:** [Tailwind CSS 3](https://tailwindcss.com/) + Material Design 3 Tokens
- **Enrutamiento:** [React Router v7](https://reactrouter.com/)
- **Cliente HTTP:** [Axios](https://axios-http.com/) con normalización automática de `/api`, interceptor JWT y cabecera `x-timezone-offset`
- **Iconografía y Efectos:** [Lucide React](https://lucide.dev/) + `canvas-confetti`

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/LautaroLeall/DurazBer-Front.git
cd DurazBer-Front

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# 5. Compilar para producción
npm run build

# 6. Previsualizar build de producción localmente
npm run preview
```

---

## ⚙️ Variables de Entorno (`.env`)

Crear un archivo `.env` en la raíz de `frontend` basado en `.env.example`:

```env
# URL del Backend (el cliente normaliza automáticamente el sufijo /api)
VITE_API_URL=http://localhost:5000/api
```

---

## 📄 Licencia

Desarrollado por **Lautaro Leal Del Prete (LLDP)**. Todos los derechos reservados.
