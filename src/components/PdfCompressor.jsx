import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { createWorker } from 'tesseract.js';
import { 
  FileUp, 
  File, 
  Download, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Globe, 
  FileSearch, 
  Copy, 
  FileText 
} from 'lucide-react';
import './PdfCompressor.css';

// Configurar el worker nativo de pdfjs a través de CDN compatible para evitar problemas de Vite bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedPdfBlob, setCompressedPdfBlob] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Nuevos estados para OCR
  const [activeTab, setActiveTab] = useState('compress'); // compress, ocr
  const [ocrLanguage, setOcrLanguage] = useState('spa'); // spa, eng
  const [extractedText, setExtractedText] = useState('');
  const [ocrPdfBlob, setOcrPdfBlob] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Novedosas referencias para Spotlight dinámico y consola analítica
  const cardRef = useRef(null);
  const consoleEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [consoleLogs, setConsoleLogs] = useState([]);

  // Detección y rastreo de movimiento del cursor 60FPS sin re-renderizado
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Coordenadas para Spotlight
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    // Inclinación 3D en perspectiva en base al centro de la tarjeta
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Rotar máximo 8 grados en cada eje para mantener la elegancia y sutileza
    const rotateX = -(deltaY / centerY) * 8;
    const rotateY = (deltaX / centerX) * 8;

    cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  // Restablecer la rotación suavemente al salir el cursor de la tarjeta
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotate-x', `0deg`);
    cardRef.current.style.setProperty('--rotate-y', `0deg`);
  };

  const addLog = (msg) => {
    setConsoleLogs(prev => {
      const updated = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      setTimeout(() => {
        if (consoleEndRef.current) {
          consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return updated;
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecciona un archivo PDF válido.');
      setStatus('error');
      return;
    }
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setStatus('idle');
    setCompressedPdfBlob(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setStatus('loading');
      setProgress(0);
      setConsoleLogs([]);
      setStatusText('Cargando el documento PDF...');

      addLog('SYSTEM: Initializing PDF compression pipeline.');
      addLog(`PARSER: Loaded file "${file.name}" (${formatSize(file.size)}).`);

      const arrayBuffer = await file.arrayBuffer();
      addLog('PARSER: Successfully parsed binary array buffer.');

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;
      addLog(`PARSER: PDF Document structure read. Total pages: ${totalPages}.`);

      // Presupuesto total conservador para imágenes = 390 KB para garantizar espacio de cabeceras en < 450 KB
      const budgetTotalBytes = 390 * 1024;
      const budgetPerPageBytes = budgetTotalBytes / totalPages;
      addLog(`OPTIMIZER: Budget allocation calculated (${formatSize(budgetPerPageBytes)} per page).`);

      const doc = new jsPDF({
        compress: true,
      });

      setStatusText(`Procesando 0 de ${totalPages} páginas...`);

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(Math.round(((pageNum - 0.5) / totalPages) * 100));
        setStatusText(`Procesando página ${pageNum} de ${totalPages}...`);
        addLog(`PAGE-${pageNum}: Fetching vector representation and layout.`);

        const page = await pdfDoc.getPage(pageNum);
        
        let scale = 1.5;
        let viewport = page.getViewport({ scale });
        addLog(`PAGE-${pageNum}: Rendering vector tree to high-density canvas scale ${scale}x.`);
        
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        let renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        addLog(`PAGE-${pageNum}: Vector render finished. Canvas viewport: ${canvas.width}x${canvas.height}.`);

        let quality = 0.65;
        let dataUrl = '';
        let sizeInBytes = 0;
        let meetsBudget = false;

        addLog(`PAGE-${pageNum}: Running iterative compression algorithm.`);
        while (!meetsBudget) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
          sizeInBytes = base64Length * 0.75;

          if (sizeInBytes <= budgetPerPageBytes || quality <= 0.15) {
            meetsBudget = true;
            addLog(`PAGE-${pageNum}: Target met. Final quality factor: ${quality.toFixed(2)}. Stream weight: ${formatSize(sizeInBytes)}.`);
          } else {
            quality -= 0.08;
            
            if (quality < 0.25 && scale > 1.0) {
              scale = 1.0;
              addLog(`PAGE-${pageNum}: Size exceedes limits. Rescaling canvas to 1.0x.`);
              viewport = page.getViewport({ scale });
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              ctx = canvas.getContext('2d');
              renderContext = { canvasContext: ctx, viewport: viewport };
              await page.render(renderContext).promise;
              quality = 0.5;
            }
          }
        }

        const width = viewport.width;
        const height = viewport.height;
        const orientation = width > height ? 'l' : 'p';

        if (pageNum === 1) {
          doc.deletePage(1);
          doc.addPage([width, height], orientation);
        } else {
          doc.addPage([width, height], orientation);
        }

        doc.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
        addLog(`PAGE-${pageNum}: Added compressed stream to final document tree.`);
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      setStatusText('Optimizando estructura final del PDF...');
      addLog('PDF-WRITER: Compressing streams and generating cross-reference tables.');
      const outputBlob = doc.output('blob');
      
      addLog('SYSTEM: Compression completed successfully.');
      setCompressedSize(outputBlob.size);
      setCompressedPdfBlob(outputBlob);
      setStatus('success');
    } catch (error) {
      console.error('Error de compresión:', error);
      addLog(`ERROR: Pipeline failed. ${error.message || error}`);
      setErrorMessage('Ocurrió un error al procesar el PDF. Asegúrate de que no esté protegido con contraseña.');
      setStatus('error');
    }
  };

  const handleOcr = async () => {
    if (!file) return;

    let worker = null;
    try {
      setStatus('loading');
      setProgress(0);
      setConsoleLogs([]);
      setStatusText('Cargando el documento PDF...');

      addLog('SYSTEM: Initializing OCR Processing pipeline.');
      addLog(`PARSER: Loaded file "${file.name}" (${formatSize(file.size)}).`);

      const arrayBuffer = await file.arrayBuffer();
      addLog('PARSER: Successfully parsed binary array buffer.');
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;
      addLog(`PARSER: PDF Document structure read. Total pages: ${totalPages}.`);

      setStatusText('Inicializando motor de OCR...');
      addLog(`OCR: Creating worker for language model "${ocrLanguage}"...`);
      worker = await createWorker(ocrLanguage);
      addLog('OCR: Worker loaded successfully and neural network initialized.');

      const doc = new jsPDF({
        compress: true,
      });

      let accumulatedText = '';

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(Math.round(((pageNum - 0.7) / totalPages) * 100));
        setStatusText(`Renderizando página ${pageNum} de ${totalPages}...`);
        addLog(`PAGE-${pageNum}: Rendering vector structure to 1.5x resolution canvas for high precision OCR.`);

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        addLog(`PAGE-${pageNum}: Rendered. Width: ${canvas.width}px, Height: ${canvas.height}px.`);

        setProgress(Math.round(((pageNum - 0.4) / totalPages) * 100));
        setStatusText(`Analizando texto (OCR) en página ${pageNum} de ${totalPages}...`);
        addLog(`PAGE-${pageNum}: Running optical character recognition (OCR) neural layers...`);

        const { data } = await worker.recognize(canvas);
        addLog(`PAGE-${pageNum}: OCR extraction successful. Recognized ${data.words ? data.words.length : 0} words.`);
        
        accumulatedText += `--- PÁGINA ${pageNum} ---\n\n${data.text}\n\n`;

        setStatusText(`Creando capa interactiva en página ${pageNum} de ${totalPages}...`);
        addLog(`PAGE-${pageNum}: Overlaying invisible interactive text layer for full text selection.`);

        const width = viewport.width;
        const height = viewport.height;
        const orientation = width > height ? 'l' : 'p';

        if (pageNum === 1) {
          doc.deletePage(1);
          doc.addPage([width, height], orientation);
        } else {
          doc.addPage([width, height], orientation);
        }

        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        doc.addImage(imageData, 'JPEG', 0, 0, width, height, undefined, 'FAST');

        if (data.words && data.words.length > 0) {
          for (const word of data.words) {
            const { text, bbox } = word;
            if (!text || text.trim() === '') continue;

            const wHeight = bbox.y1 - bbox.y0;
            const x = bbox.x0;
            const y = bbox.y1;

            const fontSize = wHeight * 0.85;
            doc.setFontSize(fontSize);
            doc.text(text, x, y, { renderingMode: 'invisible' });
          }
        }
        addLog(`PAGE-${pageNum}: Built selectable text layer.`);
        setProgress(Math.round((pageNum / totalPages) * 100));
      }

      setStatusText('Guardando documento estructurado...');
      addLog('PDF-WRITER: Packing OCR-enabled document structure.');
      const outputBlob = doc.output('blob');
      
      addLog('SYSTEM: OCR Processing pipeline finished successfully.');
      setOcrPdfBlob(outputBlob);
      setExtractedText(accumulatedText);
      setStatus('success');
    } catch (error) {
      console.error('Error en el proceso de OCR:', error);
      addLog(`ERROR: OCR Pipeline failed. ${error.message || error}`);
      setErrorMessage('Ocurrió un error al procesar el OCR. Asegúrate de tener conexión a Internet para descargar el paquete de idioma y que el PDF no esté protegido.');
      setStatus('error');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          console.error('Error terminando el worker de tesseract:', e);
        }
      }
    }
  };

  const handleDownload = () => {
    if (!compressedPdfBlob) return;
    const url = URL.createObjectURL(compressedPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = file.name.replace(/\.pdf$/i, '');
    link.download = `${baseName}_comprimido.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOcrPdf = () => {
    if (!ocrPdfBlob) return;
    const url = URL.createObjectURL(ocrPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = file.name.replace(/\.pdf$/i, '');
    link.download = `${baseName}_ocr.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = file.name.replace(/\.pdf$/i, '');
    link.download = `${baseName}_texto_extraido.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDoc = () => {
    if (!extractedText) return;
    
    const header = 
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head>" +
      "<meta charset='utf-8'>" +
      "<title>Documento Transcrito</title>" +
      "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->" +
      "<style>" +
      "body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; color: #000000; padding: 1in; }" +
      "p { margin: 0 0 12pt 0; text-align: justify; }" +
      "</style>" +
      "</head>" +
      "<body>";
    const footer = "</body></html>";
    
    const formattedText = extractedText
      .split('\n')
      .map(paragraph => paragraph.trim() ? `<p>${paragraph}</p>` : '')
      .join('');
      
    const htmlContent = header + formattedText + footer;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = file.name.replace(/\.pdf$/i, '');
    link.download = `${baseName}_transcripcion.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error al copiar el texto: ', err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setCompressedPdfBlob(null);
    setOcrPdfBlob(null);
    setExtractedText('');
    setOriginalSize(0);
    setCompressedSize(0);
    setCopySuccess(false);
    setConsoleLogs([]);
  };

  const savingsPercent = originalSize > 0 
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="compressor-container">
      {/* Tarjeta Principal con Spotlight Tracking de Mouse en referencia nativa y restablecimiento MouseLeave */}
      <div 
        className="compressor-card"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pestañas de navegación superiores */}
        <div className="compressor-tabs">
          <button 
            className={`tab-button ${activeTab === 'compress' ? 'active' : ''}`}
            onClick={() => { setActiveTab('compress'); handleReset(); }}
          >
            <FileSearch className="btn-icon" style={{ width: 18, height: 18 }} /> Compresión de PDF
          </button>
          <button 
            className={`tab-button ${activeTab === 'ocr' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ocr'); handleReset(); }}
          >
            <Globe className="btn-icon" style={{ width: 18, height: 18 }} /> Digitalización OCR
          </button>
        </div>

        <h2 className="compressor-title">
          {activeTab === 'compress' ? 'Optimización de Documentos' : 'Reconocimiento de Caracteres (OCR)'}
        </h2>
        <p className="compressor-subtitle">
          {activeTab === 'compress' 
            ? 'Reduzca el tamaño de sus expedientes y escritos PDF por debajo de 450KB con máxima fidelidad visual y de manera 100% local.'
            : 'Digitalice contratos escaneados y probanzas en PDFs interactivos con texto indexable, seleccionable y editable (Ctrl + F).'}
        </p>

        {status === 'idle' && !file && (
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf"
              onChange={handleFileChange}
            />
            <div className="dropzone-icon-container">
              <FileUp className="dropzone-icon" />
            </div>
            <p className="dropzone-text-primary">
              {activeTab === 'compress' ? 'Arrastre y suelte su expediente PDF aquí' : 'Arrastre su documento PDF aquí para digitalizar con OCR'}
            </p>
            <p className="dropzone-text-secondary">o haga clic para explorar sus archivos locales</p>
          </div>
        )}

        {file && status === 'idle' && (
          <div className="file-info-container">
            <div className="file-detail">
              {/* Plano técnico Blueprint de folios apilados en perspectiva */}
              <div className="blueprint-visual-container">
                <div className="blueprint-page page-back">
                  <div className="blueprint-line line-1"></div>
                  <div className="blueprint-line line-2"></div>
                </div>
                <div className="blueprint-page page-front">
                  <div className="blueprint-line line-1"></div>
                  <div className="blueprint-line line-2"></div>
                  <div className="blueprint-line line-3"></div>
                  <div className="blueprint-badge">PDF</div>
                </div>
              </div>
              <div className="file-meta">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(originalSize)}</span>
              </div>
            </div>

            {activeTab === 'ocr' && (
              <div className="ocr-controls">
                <span className="ocr-select-label">Idioma de Reconocimiento de Texto</span>
                <div className="ocr-select-wrapper">
                  <select 
                    className="ocr-select" 
                    value={ocrLanguage} 
                    onChange={(e) => setOcrLanguage(e.target.value)}
                  >
                    <option value="spa">Español</option>
                    <option value="eng">Inglés (English)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button className="btn-secondary" onClick={handleReset}>Reemplazar Archivo</button>
              {activeTab === 'compress' ? (
                <button className="btn-primary" onClick={handleCompress}>Optimizar Expediente</button>
              ) : (
                <button className="btn-primary" onClick={handleOcr}>Digitalizar Documento</button>
              )}
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="progress-container">
            <div className="progress-spinner-container">
              <RefreshCw className="progress-spinner" />
            </div>
            <p className="progress-status">{statusText}</p>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-percent">{progress}%</span>

            {/* MONITOR ANALÍTICO EN VIVO (Live Console Monitor) */}
            <div className="live-console-monitor">
              <div className="console-header">
                <span className="console-dot green"></span>
                <span className="console-dot yellow"></span>
                <span className="console-dot red"></span>
                <span className="console-title">Live Pipeline Monitor</span>
              </div>
              <div className="console-logs-wrapper">
                {consoleLogs.map((log, index) => (
                  <div key={index} className="console-log-line">{log}</div>
                ))}
                {consoleLogs.length === 0 && (
                  <div className="console-log-line blink">[system] STANDBY - PIPELINE IDLE...</div>
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="success-container">
            <div className="success-badge-container">
              <CheckCircle className="success-icon" />
            </div>
            
            {activeTab === 'compress' ? (
              <>
                <h3 className="success-title">¡Documento Optimizado con Éxito!</h3>
                
                <div className="result-stats">
                  <div className="stat-box">
                    <span className="stat-label">Tamaño Original</span>
                    <span className="stat-value">{formatSize(originalSize)}</span>
                  </div>
                  <div className="stat-divider">→</div>
                  <div className="stat-box success">
                    <span className="stat-label">Tamaño Comprimido</span>
                    <span className="stat-value">{formatSize(compressedSize)}</span>
                  </div>
                </div>

                {savingsPercent > 0 && (
                  <div className="savings-badge">
                    Se ha reducido un <strong>{savingsPercent}%</strong> del espacio original
                  </div>
                )}

                {compressedSize <= 460800 ? (
                  <div className="alert-box success">
                    <ShieldCheck className="alert-icon" />
                    <span>Apto para Carga: El expediente es menor a 450KB. Está listo para su presentación oficial sin riesgo de rechazo por peso.</span>
                  </div>
                ) : (
                  <div className="alert-box warning">
                    <AlertCircle className="alert-icon" />
                    <span>Aviso Técnico: El archivo final supera los 450KB debido a la gran densidad del material gráfico, pero se ha reducido al límite de lo técnicamente viable.</span>
                  </div>
                )}

                <div className="action-buttons">
                  <button className="btn-secondary" onClick={handleReset}>Optimizar Nuevo Documento</button>
                  <button className="btn-success" onClick={handleDownload}>
                    <Download className="btn-icon" /> Descargar PDF Comprimido
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="success-title">¡Digitalización OCR Completada!</h3>
                
                <div className="alert-box success">
                  <ShieldCheck className="alert-icon" />
                  <span>El documento ha sido digitalizado e indexado. Se ha integrado una capa de texto de alta precisión que permite realizar búsquedas (Ctrl + F), y seleccionar o copiar fragmentos.</span>
                </div>

                <div className="action-buttons">
                  <button className="btn-secondary" onClick={handleReset}>Digitalizar Nuevo Documento</button>
                  <button className="btn-success" onClick={handleDownloadOcrPdf}>
                    <Download className="btn-icon" /> Descargar PDF con OCR
                  </button>
                </div>

                {extractedText && (
                  <div className="extracted-text-section">
                    <div className="extracted-text-header">
                      <span className="extracted-text-title">
                        <FileText className="btn-icon" style={{ width: 18, height: 18 }} /> Texto Transcrito
                      </span>
                      <div className="extracted-text-actions">
                        {copySuccess ? (
                          <div className="copy-success-badge">
                            <CheckCircle className="btn-icon" style={{ width: 14, height: 14 }} /> Copiado
                          </div>
                        ) : (
                          <button 
                            className="btn-icon-only" 
                            title="Copiar texto al portapapeles"
                            onClick={handleCopyToClipboard}
                          >
                            <Copy className="btn-icon" style={{ width: 16, height: 16 }} />
                          </button>
                        )}
                        <button 
                          className="btn-icon-only" 
                          title="Descargar transcripción como .txt"
                          onClick={handleDownloadTxt}
                        >
                          <Download className="btn-icon" style={{ width: 16, height: 16 }} />
                        </button>
                        <button 
                          className="btn-word-download" 
                          title="Exportar transcripción completa a Word (.doc)"
                          onClick={handleDownloadDoc}
                        >
                          <FileText className="btn-icon" style={{ width: 14, height: 14 }} />
                          <span>Exportar a Word</span>
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className="extracted-text-area"
                      value={extractedText}
                      readOnly
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="error-container">
            <div className="error-badge-container">
              <AlertCircle className="error-icon" />
            </div>
            <h3 className="error-title">Error en el Procesamiento</h3>
            <p className="error-description">{errorMessage}</p>
            <button className="btn-primary" onClick={handleReset}>Reintentar Operación</button>
          </div>
        )}

        <div className="privacy-footer">
          <ShieldCheck className="privacy-icon" />
          <span>Garantía de Confidencialidad: Todo el procesamiento se realiza localmente en su terminal. Sus archivos y documentos nunca se transmiten a servidores externos.</span>
        </div>
      </div>
    </div>
  );
}
