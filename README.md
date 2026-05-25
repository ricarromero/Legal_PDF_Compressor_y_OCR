# Legal PDF Compressor & OCR 

Aplicación web para comprimir archivos PDF y aplicar OCR de forma local, pensada especialmente para documentos jurídicos, expedientes escaneados y presentaciones digitales con límite de peso.

El objetivo principal del proyecto es resolver dos problemas frecuentes en entornos jurídicos y administrativos:

- Reducir el peso de archivos PDF para cumplir con límites de carga en portales digitales.
- Convertir documentos escaneados en archivos buscables mediante OCR.

Todo el procesamiento se realiza del lado del cliente, sin subir archivos a servidores externos.

---

## 📌 Problema

En muchos portales judiciales o administrativos existen límites estrictos de peso para subir documentación digital.  
Además, gran parte de los expedientes, escritos o pruebas escaneadas no permiten buscar texto, copiar contenido o reutilizar información fácilmente.

Esto genera problemas como:

- Archivos rechazados por superar el límite de peso.
- Pérdida de tiempo usando herramientas externas.
- Riesgos de privacidad al subir documentos sensibles a plataformas online.
- Documentos escaneados que no permiten buscar texto con `Ctrl + F`.

---

## 💡 Solución

Legal PDF Compressor & OCR permite comprimir PDFs y aplicar reconocimiento óptico de caracteres directamente desde el navegador.

La aplicación procesa los documentos localmente, manteniendo la privacidad de la información y permitiendo generar archivos más livianos, buscables y reutilizables.

---

## 🚀 Funcionalidades principales

- Compresión de archivos PDF.
- Optimización progresiva para reducir el peso del documento.
- Ajuste pensado para límites estrictos de carga digital.
- OCR para documentos escaneados.
- Soporte para texto en español e inglés.
- Generación de PDFs buscables.
- Extracción y visualización del texto reconocido.
- Copia rápida del texto al portapapeles.
- Exportación del texto en formato `.txt`.
- Exportación del texto a formato compatible con Word.
- Procesamiento 100% local desde el navegador.
- Interfaz moderna, clara y responsive.

---

## 🔒 Privacidad

A diferencia de muchas herramientas online, esta aplicación no sube los archivos del usuario a servidores externos.

Todo el procesamiento se realiza localmente en el navegador:

- El PDF se carga en memoria local.
- La compresión se ejecuta del lado del cliente.
- El OCR se procesa localmente.
- Los documentos no se almacenan en una base de datos.
- No se envían archivos a la nube.

Esto resulta especialmente importante para documentos jurídicos, contratos, expedientes, pruebas o información sensible.

---

## 🛠️ Tecnologías utilizadas

- React
- Vite
- JavaScript
- PDF.js
- jsPDF
- Tesseract.js
- Lucide React
- CSS

---

## 🧠 Cómo funciona

La aplicación utiliza un flujo de procesamiento local:

1. El usuario carga un archivo PDF.
2. El sistema renderiza las páginas del documento en el navegador.
3. Se aplica un proceso de compresión sobre las imágenes del PDF.
4. Si el usuario lo desea, se ejecuta OCR sobre el documento.
5. El texto detectado puede visualizarse, copiarse o exportarse.
6. El sistema permite descargar el documento optimizado.



