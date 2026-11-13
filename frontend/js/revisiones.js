import { post, get, repairMojibake } from './api.js';
import { getCurrentUser } from './auth.js';

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';

function escapeHtml(value) {
  return repairMojibake(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function formatReviewDate(value) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function updateSelectedAdvance(root, option) {
  if (!option || !option.value) return;
  const link = root.querySelector('#selectedAdvanceLink');
  const name = root.querySelector('#selectedAdvanceName');
  const meta = root.querySelector('#selectedAdvanceMeta');
  const downloadButton = root.querySelector('#downloadAdvanceButton');
  const studentId = option.dataset.studentId;
  if (link) link.href = `${API_BASE_URL}/api/avances/${encodeURIComponent(option.value)}/descargar`;
  if (name) name.textContent = repairMojibake(option.dataset.fileName || 'Avance seleccionado');
  if (meta) meta.textContent = `Estudiante: ${studentId} · Abrir PDF`;
  if (downloadButton) downloadButton.textContent = 'Abrir PDF';
  root.dispatchEvent(new CustomEvent('advance:selected', {
    bubbles: true,
    detail: { avanceId: Number(option.value), estudianteId: studentId }
  }));
}

function renderAdvanceSelector() {
  return `
    <div style="display: flex; gap: 16px; margin: 16px 0;">
      <div style="flex: 1;">
        <label class="field-label" for="reviewStudent">Seleccionar memorista</label>
        <select id="reviewStudent" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);">
          <option value="">Cargando memoristas...</option>
        </select>
      </div>
      <div style="flex: 1;">
        <label class="field-label" for="reviewAdvance">Versión que se revisará</label>
        <select id="reviewAdvance" aria-describedby="reviewAdvanceStatus" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);">
          <option value="">Cargando avances...</option>
        </select>
      </div>
    </div>
    <p class="decision-feedback" id="reviewAdvanceStatus" role="status" style="margin-top: -8px; margin-bottom: 16px;">Consultando avances...</p>
  `;
}

export function renderReviews(isGuide) {
  if (isGuide) {
    return `
      <div class="scenario-grid" data-review-mode="guide">
        <section class="interaction-panel review-panel">
          <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
          <a class="review-document" id="selectedAdvanceLink" href="#" target="_blank" rel="noopener">
            <span class="file-icon">PDF</span>
            <div><strong id="selectedAdvanceName">Selecciona una entrega</strong><small id="selectedAdvanceMeta">Abrir PDF seleccionado</small></div>
            <span class="review-status" id="reviewTag">Pendiente</span>
            <span class="action-button" id="downloadAdvanceButton">Abrir PDF</span>
          </a>
          ${renderAdvanceSelector()}
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
    <div class="scenario-grid" data-review-mode="student" data-review-student-id="">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>Mis revisiones</span></div>
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
  const buttons = root.querySelectorAll('.review-decision');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const textarea = root.querySelector('#reviewNotes');
      const advanceSelect = root.querySelector('#reviewAdvance');
      const feedback = root.querySelector('#reviewFeedback');
      const state = root.querySelector('#reviewState');
      const tag = root.querySelector('#reviewTag');
      
      const observaciones = textarea.value.trim();
      const resultado = button.dataset.decision || button.textContent.trim();
      const avanceId = Number(advanceSelect?.value);

      if (!observaciones || !Number.isInteger(avanceId) || avanceId <= 0) {
        feedback.textContent = !observaciones
          ? 'Ingresa una observación o comentario antes de evaluar.'
          : 'Selecciona la versión que estás revisando.';
        feedback.style.color = '#c0392b';
        return;
      }

      feedback.textContent = 'Guardando revisión...';
      feedback.style.color = 'var(--muted)';

      try {
        await post('/api/revisiones', {
          avanceId,
          observaciones: observaciones,
          resultado: resultado
        });

        if (state) state.textContent = 'Revisado';
        if (tag) tag.textContent = 'Revisado';
        feedback.style.color = 'var(--teal)';
        feedback.textContent = `Guardado: "${resultado}" registrado correctamente.`;

        buttons.forEach((item) => item.classList.remove('is-selected'));
        button.classList.add('is-selected');
        root.dispatchEvent(new CustomEvent('review:created', {
          bubbles: true,
          detail: { avanceId, resultado }
        }));
      } catch (err) {
        feedback.style.color = '#c0392b';
        feedback.textContent = `Error al guardar: ${err.message}`;
      }
    });
  });

  const studentFeedbackArea = root.querySelector('#studentFeedbackArea');
  const reviewAdvance = root.querySelector('#reviewAdvance');
  const reviewAdvanceStatus = root.querySelector('#reviewAdvanceStatus');
  const reviewStudentId = root.querySelector('[data-review-student-id]')?.dataset.reviewStudentId
    || getCurrentUser()?.estudianteId
    || getCurrentUser()?.rut;

  if (reviewAdvance) {
    const advancesRequest = root.querySelector('[data-review-mode="guide"]')
      ? get('/api/revisiones/pendientes')
      : get(`/api/avances?estudianteId=${encodeURIComponent(reviewStudentId)}`);
    advancesRequest
      .then((advances) => {
        if (!Array.isArray(advances)) {
          throw new Error('El servidor devolvió una lista de avances inválida.');
        }

        const reviewStudent = root.querySelector('#reviewStudent');

        if (advances.length === 0) {
          if (reviewStudent) reviewStudent.innerHTML = '<option value="">No hay memoristas pendientes</option>';
          reviewAdvance.innerHTML = '<option value="">No hay avances para revisar</option>';
          if (reviewAdvanceStatus) reviewAdvanceStatus.textContent = 'Primero debe registrarse un avance.';
          return;
        }

        if (reviewStudent) {
          const estudiantesUnicos = [];
          const idsVistos = new Set();
          
          advances.forEach(adv => {
            if (!idsVistos.has(adv.estudianteId)) {
              idsVistos.add(adv.estudianteId);
              estudiantesUnicos.push({
                id: adv.estudianteId,
                nombre: adv.nombreEstudiante || adv.estudianteIdentificacion || `ID: ${adv.estudianteId}`
              });
            }
          });

          reviewStudent.replaceChildren(...estudiantesUnicos.map(estudiante => {
            const option = document.createElement('option');
            option.value = estudiante.id;
            option.textContent = estudiante.nombre;
            return option;
          }));

          const actualizarAvances = () => {
            const estudianteSeleccionado = reviewStudent.value;
            const avancesFiltrados = advances.filter(adv => String(adv.estudianteId) === String(estudianteSeleccionado));
            
            reviewAdvance.replaceChildren(...avancesFiltrados.map((advance) => {
              const option = document.createElement('option');
              option.value = advance.avanceId;
              option.dataset.studentId = advance.estudianteId;
              option.dataset.fileName = advance.nombreArchivo;
              option.textContent = `${advance.nombreArchivo}${advance.esVersionFinal ? ' · Versión final' : ''}`;
              return option;
            }));

            if (reviewAdvance.options.length > 0) {
              updateSelectedAdvance(root, reviewAdvance.options[0]);
            } else {
              reviewAdvance.innerHTML = '<option value="">Sin avances</option>';
            }
          };

          reviewStudent.addEventListener('change', actualizarAvances);
          actualizarAvances();

        } else {
          reviewAdvance.replaceChildren(...advances.map((advance) => {
            const option = document.createElement('option');
            option.value = advance.avanceId;
            option.dataset.studentId = advance.estudianteId;
            option.dataset.fileName = advance.nombreArchivo;
            option.textContent = `${advance.nombreArchivo}${advance.esVersionFinal ? ' · Versión final' : ''}`;
            return option;
          }));
          updateSelectedAdvance(root, reviewAdvance.options[0]);
        }

        if (reviewAdvanceStatus) {
          reviewAdvanceStatus.textContent = 'La revisión quedará asociada a la versión seleccionada.';
        }
      })
      .catch((error) => {
        reviewAdvance.innerHTML = '<option value="">No se pudieron cargar los avances</option>';
        if (reviewAdvanceStatus) reviewAdvanceStatus.textContent = `Error al cargar los avances: ${error.message}`;
      });
      
    reviewAdvance.addEventListener('change', () => {
      updateSelectedAdvance(root, reviewAdvance.options[reviewAdvance.selectedIndex]);
    });
  }

  reviewAdvance?.addEventListener('change', () => {
    updateSelectedAdvance(root, reviewAdvance.options[reviewAdvance.selectedIndex]);
  });

  if (studentFeedbackArea) {
    const currentUser = getCurrentUser();
    const estudianteId = currentUser?.estudianteId || currentUser?.rut;
    Promise.all([
      get('/api/revisiones'),
      get(`/api/avances?estudianteId=${encodeURIComponent(estudianteId)}`)
    ])
      .then(([revisiones, avances]) => {
        const lista = Array.isArray(revisiones) ? revisiones : [];
        const entregas = Array.isArray(avances) ? avances : [];
        const revisados = new Set(lista.map((revision) => String(revision.avanceId)));
        const pendientes = entregas.filter((avance) => !revisados.has(String(avance.avanceId)));

        if (lista.length === 0 && pendientes.length === 0) {
          studentFeedbackArea.textContent = 'No hay avances ni observaciones para mostrar.';
          return;
        }

        studentFeedbackArea.innerHTML = [
          ...lista.map((rev) => `
            <div style="padding: 14px; margin-bottom: 12px; border-left: 4px solid var(--coral); background: #ffffff;">
              <strong>${escapeHtml(rev.documento || 'Documento revisado')}</strong>
              <p style="margin: 8px 0 4px; color: var(--ink);">${escapeHtml(rev.observaciones)}</p>
              <small style="color: var(--muted);">
                Resultado: ${escapeHtml(rev.resultado || 'Revisado')} ·
                ${escapeHtml(rev.profesor_nombre || 'Profesor guía')} ·
                ${escapeHtml(formatReviewDate(rev.fecha_revision))}
              </small>
            </div>
          `),
          ...pendientes.map((avance) => `
            <div style="padding: 14px; margin-bottom: 12px; border-left: 4px solid var(--muted); background: #ffffff;">
              <strong>${escapeHtml(avance.nombreArchivo)}</strong>
              <p style="margin: 8px 0 4px; color: var(--ink);">
                Este avance sigue en proceso de revisión.
              </p>
              <small style="color: var(--muted);">${escapeHtml(avance.estado || 'Esperando revisión')}</small>
            </div>
          `)
        ].join('');
      })
      .catch((err) => {
        studentFeedbackArea.textContent = `Error al cargar revisiones: ${err.message}`;
      });
  }
}