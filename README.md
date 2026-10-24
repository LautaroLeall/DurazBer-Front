# DurazBer - Frontend 🍑✨

Frontend fotorrealista e interactivo de **DurazBer**, la aplicación de seguimiento de consumo botánico de duraznos con renderizado 3D en tiempo real, desglose nutricional y analítica diaria.

---

## 🌟 Características Principales

- **Visor 3D Botánico Hiperrealista (Three.js WebGL):**
  - **ENTERO:** Durazno botánico 360° con morfología orgánica, cavidad peduncular, sutura carpelar, textura procedural aterciopelada y gotas de rocío.
  - **CAROZO:** Sección transversal con mesocarpo jugoso (pulpa estriada) y endocarpo esculpido (carozo 3D) con deslizador de extracción interactiva.
  - **DUAL:** Comparativa lado a lado en un solo espacio 3D.
  - **Interacción fluida:** Rotación 360° suave con 1 dedo o mouse, zoom con dos dedos (pinch) o rueda.
- **Contador Diario de Cosecha:** Anillo de progreso SVG reactivo con botón táctil de incremento optimista (+1, +2, -1) y desglose de macros (kcal, fibra, vitamina C, hidratación).
- **Historial y Racha:** Registro cronológico de consumo, estadísticas de rachas consecutivas y filtros de consulta.
- **Analítica Visual:** Gráficos de tendencias semanales y mensuales de consumo de duraznos.
- **Diseño Responsivo:** Paleta cromática Material Design 3 inspirada en tonos de durazno, damasco y terracota, con soporte completo para móviles y escritorio.
- **Loader de Entrada:** Pantalla de bienvenida coordinada que asegura que la escena WebGL y los datos de base de datos estén 100% listos antes de interactuar.

---

## 🛠️ Tecnologías

- **Framework:** [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **3D Engine:** [Three.js](https://threejs.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + Material Theme Tokens
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Enrutamiento:** [React Router v6](https://reactrouter.com/)
- **Cliente HTTP:** Fetch API nativo con interceptores de autenticación y renovación de sesión.

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/LautaroLeall/DurazBer-Front.git
cd DurazBer-Front

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Copiar .env.example a .env
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Compilar para producción
npm run build
```

---

## 📄 Licencia

Desarrollado con dedicación por **Lautaro Leal Del Prete**. Todos los derechos reservados.
