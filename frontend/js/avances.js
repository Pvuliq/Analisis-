export function renderStudentAdvances() {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel upload-panel">
        <div class="panel-topline"><span class="story-symbol">01</span><span>HU-01 · Entrega de documento</span></div>
        <h4>Subir avance de memoria</h4>
        <p>Adjunta una nueva versión para registrarla como entrega oficial del proceso.</p>
        <label class="file-picker" for="advanceFile">Seleccionar archivo PDF</label>
        <input id="advanceFile" class="visually-hidden" type="file" accept="application/pdf">
        <div class="file-well"><span class="file-icon">PDF</span><div><strong id="selectedFile">Avance_memoria_v03.pdf</strong><small id="selectedFileMeta">2.4 MB · listo para enviar</small></div><span class="file-state" id="fileState">OK</span></div>
        <button class="action-button" id="uploadAction" type="button">Registrar entrega</button>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Al confirmar</p>
        <ul class="evidence-list">
          <li><span>01</span>Se registra fecha y hora exacta.</li>
          <li><span>02</span>El estado cambia a “Esperando revisión”.</li>
          <li><span>03</span>Se notifica al Profesor Guía.</li>
        </ul>
      </aside>
    </div>
  `;
}

export function renderGuideAdvances() {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">01</span><span>Memoria de Paula Castillo</span></div>
        <h4>Avances recibidos</h4>
        <p>Consulta las versiones entregadas por la memorista antes de registrar una revisión.</p>
        <div class="file-well"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · Esperando revisión</small></div><span class="review-status">Pendiente</span></div>
        <button class="action-button" data-section="revisiones" type="button">Abrir revisión</button>
      </section>
      <aside class="evidence-panel"><p class="section-label">Seguimiento</p><strong>1 avance pendiente</strong><p>La memoria específica queda lista para revisar sus observaciones y progreso.</p></aside>
    </div>
  `;
}

export function bindAdvanceEvents(root = document) {
  const fileInput = root.querySelector('#advanceFile');
  const selectedFile = root.querySelector('#selectedFile');
  const selectedFileMeta = root.querySelector('#selectedFileMeta');
  const fileState = root.querySelector('#fileState');
  const uploadAction = root.querySelector('#uploadAction');

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    selectedFile.textContent = file.name;
    if (selectedFileMeta) {
      selectedFileMeta.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · listo para enviar`;
    }
    if (fileState) fileState.textContent = 'OK';
    if (uploadAction) uploadAction.disabled = false;
  });

  uploadAction?.addEventListener('click', () => {
    uploadAction.textContent = 'Avance subido con éxito';
    uploadAction.classList.add('is-complete');
  });
}
