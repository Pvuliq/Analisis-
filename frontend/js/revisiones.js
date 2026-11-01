import { post, get } from './api.js';

export function renderReviews(isGuide) {
  if (isGuide) {
    return `
      <div class="scenario-grid">
        <section class="interaction-panel review-panel">
          <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
          <div class="review-document"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · versión específica</small></div><span class="review-status" id="reviewTag">Pendiente</span></div>
          <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
          <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
          <div class="decision-actions">
            <button class="action-button review-decision" data-decision="Avance suficiente" type="button">Avance suficiente</button>
            <button class="secondary-button review-decision" data-decision="Necesita correcciones" type="button">Necesita correcciones</button>
          </div>
          <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
        </section>
        <aside class="evidence-panel">
          <p class="section-label">Estado de la revisión</p>
          <strong id="reviewState">Sin evaluar</strong>
          <p>Las observaciones quedan guardadas en la base de datos y se notifican al estudiante.</p>
          <span class="decision-tag">F-01 · HU-02</span>
        </aside>
      </div>
    `;
  }

  return `
    <div class="scenario-grid">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">02</span><span>Mis revisiones</span></div>
        <h4>Observaciones del Profesor Guía</h4>
        <div id="studentFeedbackArea" class="empty-review">Consultando observaciones en el servidor...</div>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Estado</p>
        <strong>En seguimiento</strong>
        <p>Aquí aparecen los comentarios registrados por tu profesor.</p>
      </aside>
    </div>
  `;
}

export function bindReviewEvents(root = document) {
  // Lógica de Profesor Guía: Guardar el comentario y la decisión
  const buttons = root.querySelectorAll('.review-decision');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const textarea = root.querySelector('#reviewNotes');
      const feedback = root.querySelector('#reviewFeedback');
      const state = root.querySelector('#reviewState');
      const tag = root.querySelector('#reviewTag');
      
      const observaciones = textarea.value.trim();
      const resultado = button.dataset.decision || button.textContent.trim();

      if (!observaciones) {
        feedback.textContent = 'Ingresa una observación o comentario antes de evaluar.';
        feedback.style.color = '#c0392b';
        return;
      }

      feedback.textContent = 'Guardando revisión...';
      feedback.style.color = 'var(--muted)';

      try {
        await post('/api/revisiones', {
          documento: 'Avance_memoria_v03.pdf',
          observaciones: observaciones,
          resultado: resultado
        });

        if (state) state.textContent = 'Revisado';
        if (tag) tag.textContent = 'Revisado';
        feedback.style.color = 'var(--teal)';
        feedback.textContent = `Guardado: "${resultado}" registrado correctamente.`;

        buttons.forEach((item) => item.classList.remove('is-selected'));
        button.classList.add('is-selected');
      } catch (err) {
        feedback.style.color = '#c0392b';
        feedback.textContent = `Error al guardar: ${err.message}`;
      }
    });
  });

  // Lógica de Memorista: Cargar y listar las observaciones desde la API
  const studentFeedbackArea = root.querySelector('#studentFeedbackArea');
  if (studentFeedbackArea) {
    get('/api/revisiones')
      .then((revisiones) => {
        if (!revisiones || revisiones.length === 0) {
          studentFeedbackArea.textContent = 'No hay observaciones nuevas para mostrar.';
          return;
        }

        studentFeedbackArea.innerHTML = revisiones.map((rev) => `
          <div style="padding: 14px; margin-bottom: 12px; border-left: 4px solid var(--coral); background: #ffffff;">
            <strong>Resultado: ${rev.resultado}</strong>
            <p style="margin: 8px 0 4px; color: var(--ink);">${rev.observaciones}</p>
            <small style="color: var(--muted);">${new Date(rev.fecha_revision).toLocaleString()}</small>
          </div>
        `).join('');
      })
      .catch((err) => {
        studentFeedbackArea.textContent = `Error al cargar revisiones: ${err.message}`;
      });
  }
}

export async function cargarEntregasPendientes(root) {
  const listaEntregas = root.querySelector('#listaEntregas');
  const listaContainer = root.querySelector('#listaEntregasContainer');
  const formRevision = root.querySelector('#formularioRevision');
  const docNombre = root.querySelector('#docSeleccionadoNombre');
  const btnCancelar = root.querySelector('#btnCancelarRevision');

  if (!listaEntregas) return;

  try {
    const entregas = await get('/api/revisiones/pendientes');

    if (!entregas || entregas.length === 0) {
      listaEntregas.innerHTML = '<div class="empty-review">No hay entregas pendientes de revisión.</div>';
      return;
    }

    listaEntregas.innerHTML = entregas.map(entrega => `
      <div class="file-well" style="cursor: pointer;" data-nombre="${entrega.nombreArchivo}">
        <span class="file-icon">PDF</span>
        <div>
          <strong>${entrega.nombreArchivo}</strong>
          <small>ID Estudiante: ${entrega.estudianteId || 'N/A'} · ${new Date(entrega.fechaEntrega).toLocaleDateString()}</small>
        </div>
        <button class="secondary-button btn-seleccionar" type="button">Seleccionar</button>
      </div>
    `).join('');

    listaEntregas.querySelectorAll('.file-well').forEach(item => {
      item.querySelector('.btn-seleccionar').addEventListener('click', () => {
        docNombre.textContent = item.dataset.nombre;
        listaContainer.style.display = 'none';
        formRevision.style.display = 'block';
      });
    });

    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        formRevision.style.display = 'none';
        listaContainer.style.display = 'block';
      });
    }
  } catch (error) {
    console.error(error);
    listaEntregas.innerHTML = '<div class="empty-review">Error al cargar las entregas. Verifica que el backend esté corriendo.</div>';
  }
}