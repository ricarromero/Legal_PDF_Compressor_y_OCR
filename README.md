# ⚖️ PDF Compressor & OCR — Optimizador y Digitalizador de Expedientes Jurídicos

¡Bienvenido a **PDF Compressor & OCR**! Una aplicación web de vanguardia, moderna y de nivel premium diseñada específicamente para abogados, profesionales jurídicos y administrativos. Su objetivo principal es resolver dos de los desafíos técnicos más frustrantes de la práctica judicial cotidiana: el límite de peso en los portales electrónicos de carga oficial (habitualmente **450 KB**) y la necesidad de digitalizar y hacer buscables los escritos o pruebas escaneadas.

Todo esto bajo un modelo de **privacidad absoluta y secreto profesional en modo local** (100% del lado del cliente).

---


## ✨ Características Principales

### 📦 1. Compresión y Optimización Inteligente
*   **Ajuste al Límite de Peso (450 KB):** Diseñado con presupuestos de bytes estrictos para lograr que expedientes extensos o escritos escaneados pesen menos del límite oficial de presentación digital.
*   **Algoritmo Iterativo de Compresión:** Analiza y reduce de manera inteligente y progresiva la calidad de las imágenes (JPEG) y, si es necesario, reduce la escala de renderizado de la página hasta encajar en el tamaño deseado, garantizando que el documento mantenga la **máxima legibilidad visual** técnicamente viable.
*   **Indicador Visual de Aptitud de Carga:** Sistema de alertas inteligentes que te indica en verde cuando el archivo resultante es menor a 450 KB y está listo para su presentación electrónica sin riesgo de rechazo por peso.

### 🔍 2. Digitalización OCR de Alta Precisión
*   **Motor OCR Multilingüe Integrado:** Usa tecnología avanzada de reconocimiento óptico de caracteres para digitalizar documentos escaneados planos (en PDF o imágenes de contratos, fallos, notificaciones o probanzas).
*   **Soporte de Idiomas:** Soporta análisis de texto de alta precisión en **Español** e **Inglés**.
*   **PDFs Interactivos y Buscables (Ctrl + F):** Reconstruye el documento PDF integrando una **capa de texto invisible pero indexable y seleccionable** exactamente encima de la imagen de fondo. Puedes abrir el archivo en cualquier visor (como Adobe Reader o el navegador) y buscar palabras clave, resaltar o copiar texto directamente.

### 📝 3. Panel de Transcripción y Exportación Directa
*   **Visualización en Tiempo Real:** Visualiza todo el texto extraído del documento a través de un panel interactivo.
*   **Copiado Rápido:** Copia el texto completo al portapapeles con un solo clic.
*   **Exportación Versátil:**
    *   Descarga directa en texto plano (`.txt`).
    *   **Exportación nativa a Microsoft Word (`.doc`):** Genera un archivo de Word estructurado con párrafos y estilos de tipografía Arial ideales para redactar escritos de contestación, demandas o resúmenes sobre el texto transcrito.

---

## 🔒 Garantía de Privacidad y Secreto Profesional (Zero Server-Upload)

En el ámbito jurídico, la confidencialidad de la información es sagrada. A diferencia de las herramientas web tradicionales en línea que suben tus documentos confidenciales a servidores remotos para procesarlos, **esta aplicación garantiza una total confidencialidad**:

*   **Procesamiento 100% Local:** Todo el procesamiento del PDF, el renderizado de páginas, la compresión de imágenes y la detección de caracteres por OCR se ejecuta en la memoria local de tu navegador web.
*   **Cero Transferencias:** Tus expedientes, contratos, datos personales y probanzas **nunca se envían a ningún servidor externo o nube**.
*   **Funciona Sin Conexión:** Una vez cargada la aplicación, la compresión y la digitalización pueden funcionar sin conexión a Internet (excepto por la primera carga inicial del modelo de idioma del OCR).

---

## 🛠️ Pila Tecnológica

La aplicación está construida sobre tecnologías modernas de alto rendimiento:

*   **React (v19) + Vite:** Estructura y desarrollo ultra rápido del frontend en Single Page Application.
*   **PDF.js (`pdfjs-dist`):** Motor de Mozilla de alta fidelidad para leer y renderizar documentos PDF complejos a nivel de Canvas.
*   **jsPDF:** Biblioteca premium para reconstruir, estructurar, comprimir y generar los documentos PDF de salida con texto vectorial interactivo superpuesto.
*   **Tesseract.js:** El motor de Reconocimiento Óptico de Caracteres (OCR) basado en redes neuronales, portado directamente a Javascript para su funcionamiento local.
*   **Lucide React:** Set de iconos limpios, modernos y vectoriales.
*   **Vanilla CSS:** Diseño premium con gradientes suaves, micro-animaciones en botones, paneles de pestañas interactivos y una experiencia de usuario de nivel profesional con enfoque de accesibilidad.

---

## 🚀 Instalación y Configuración Local

Si deseas ejecutar este proyecto en tu propia computadora, sigue estos sencillos pasos:

### Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada) y `npm`.

### Pasos
1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/ricarromero/pdf-compressor.git
    cd pdf-compressor
    ```

2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo local:**
    ```bash
    npm run dev
    ```

4.  **Abrir en el navegador:**
    Abre la dirección que te indique la consola (generalmente `http://localhost:5173`) para comenzar a comprimir y digitalizar tus archivos.

5.  **Construir para producción (opcional):**
    Si deseas compilar la aplicación para desplegarla en un servidor estático web:
    ```bash
    npm run build
    ```

---

## 🧠 ¿Cómo funciona la compresión iterativa?

Para lograr reducir documentos PDF por debajo del exigente límite de **450 KB** sin dejarlos borrosos, la aplicación utiliza una lógica matemática inteligente:

1.  **Carga y Presupuesto:** Calcula el número total de páginas del PDF y asigna un **presupuesto máximo de peso por página** (basado en un límite seguro total de `390 KB` de datos puros de imagen para dejar margen a cabeceras del PDF y texto).
2.  **Renderizado en Alta:** Renderiza cada página en un Canvas virtual usando una escala inicial de `1.5x` para no perder nitidez tipográfica.
3.  **Bucle de Optimización:**
    *   Convierte el Canvas a una imagen en formato `JPEG`.
    *   Calcula dinámicamente el tamaño estimado del archivo resultante en Base64.
    *   Si supera el presupuesto de bytes asignado por página, reduce de manera gradual el parámetro de calidad (`quality`).
    *   Si la calidad cae por debajo del `25%` y la página sigue siendo muy pesada (por ejemplo, por tener demasiadas imágenes complejas), reduce la escala de renderizado a `1.0x` y repite el proceso desde una calidad intermedia.
4.  **Embalado Final:** Agrega cada imagen optimizada a una nueva estructura de `jsPDF` utilizando la compresión nativa rápida de la biblioteca, asegurando que el peso total se mantenga lo más bajo posible con una legibilidad sobresaliente.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de utilizarlo, modificarlo y adaptarlo a tus necesidades o a las de tu estudio jurídico.

---
*Desarrollado con ❤️ para simplificar el día a día en la gestión documental judicial.*
