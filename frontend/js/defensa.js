import { get, post, apiUrl } from './api.js';
import { getCurrentUser } from './auth.js';
const DEFENSE_API_PATH = '/api/defensas';

function activeStudentId() {
  const user = getCurrentUser();
  return user?.estudianteId || user?.rut || '';
}

function renderApprovalPanel(compact = false) {
  const panelClass = compact ? 'compact-approval-panel' : 'approval-panel';

  return `
    <section class="interaction-panel ${panelClass}">
      <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Defensa</span></div>
      <h4>Checklist para autorizar defensa</h4>
      <p>El sistema comprobará los requisitos de la memoria antes de registrar la autorización.</p>
      <ul class="requirement-list">
        <li class="requirement-pending" data-requirement="final">
          <span>01</span>Versión final del documento: <strong data-requirement-status>Consultando...</strong>
        </li>
        <li class="requirement-pending" data-requirement="review">
          <span>02</span>Revisión de la versión final: <strong data-requirement-status>Consultando...</strong>
        </li>
        <li class="requirement-pending" data-requirement="authorization">
          <span>03</span>Visto bueno formal: <strong data-requirement-status>Pendiente</strong>
        </li>
      </ul>
      <p>Estado del proceso: <strong data-defense-state>Consultando...</strong></p>
      <button class="action-button" data-approval-action type="button" disabled>Emitir visto bueno</button>
      <p class="decision-feedback" data-defense-feedback role="status">Consultando los requisitos en el servidor...</p>
    </section>
  `;
}

export function renderGuideReviewAndDefense() {
  return `
    <div class="combined-review-layout" data-defense-student-id="" data-review-mode="guide" data-review-student-id="">
      <section class="interaction-panel review-panel">
        <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
        <div class="review-document"><span class="file-icon">PDF</span><div><strong id="selectedAdvanceName">Avance_memoria_v03.pdf</strong><small id="selectedAdvanceMeta">Entregado hoy · versión específica</small></div><span class="review-status" id="reviewTag">Pendiente</span><a class="action-button" id="downloadAdvanceButton" href="#" target="_blank" rel="noopener" style="display:none;">Abrir PDF</a><a id="selectedAdvanceLink" href="#" style="display:none;"></a></div>
        
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
        
        <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
        <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
        <div class="decision-actions">
          <button class="action-button review-decision" data-decision="Avance suficiente" type="button">Avance suficiente</button>
          <button class="secondary-button review-decision" data-decision="Necesita correcciones" type="button">Necesita correcciones</button>
        </div>
        <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
      </section>
      ${renderApprovalPanel(true)}
    </div>
  `;
}

export function renderReviewerEvaluation() {
  return `
    <div class="combined-review-layout" data-review-mode="reviewer">
      <section class="interaction-panel review-panel">
        <div class="panel-topline"><span class="story-symbol">08</span><span>HU-08 · Evaluación Correferente</span></div>
        <div class="review-document">
          <span class="file-icon">PDF</span>
          <div>
            <strong id="correfDocTitle">Selecciona un memorista</strong>
            <small id="correfDocMeta">Los informes finales disponibles se mostrarán aquí.</small>
          </div>
          <span class="review-status" id="correfDocStatus">Pendiente</span>
          <a class="action-button" id="correfOpenReport" href="#" target="_blank" rel="noopener" style="display:none;">Abrir informe final</a>
        </div>
        
        <div style="display: flex; gap: 16px; margin: 16px 0;">
          <div style="flex: 2;">
            <label class="field-label" for="correfStudentSelect">Memorista asignado</label>
            <select id="correfStudentSelect" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);">
              <option value="">Cargando memoristas...</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label class="field-label" for="correfGrade">Nota (0 a 100 · mín 70)</label>
            <input type="number" id="correfGrade" min="0" max="100" step="1" placeholder="Ej: 85" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);" disabled>
          </div>
        </div>
        
        <label class="field-label" for="correfNotes">Dictamen y observaciones para el examen de título</label>
        <textarea id="correfNotes" rows="4" placeholder="Indica observaciones metodológicas y correcciones del informe final..." disabled></textarea>
        
        <div class="decision-actions">
          <button class="action-button" id="submitCorrefEval" type="button" disabled>Registrar evaluación</button>
        </div>
        <p class="decision-feedback" id="correfFeedback" role="status">Cargando memoristas...</p>
      </section>

      <aside class="evidence-panel">
        <p class="section-label">Ponderación académica</p>
        <strong>Informe Escrito (60%)</strong>
        <p>Tu calificación pondera el 60% de la nota final del informe de titulación.</p>
        <span class="decision-tag">Aprobación: &ge; 70</span>
      </aside>
    </div>
  `;
}

export function renderDefense(isGuide) {
  if (isGuide) {
    return `
      <div class="scenario-grid" data-defense-student-id="">
        ${renderApprovalPanel()}
        <aside class="evidence-panel">
          <p class="section-label">Estado de la memoria</p>
          <strong data-defense-state>Consultando...</strong>
          <p>El estado se obtiene del proceso registrado en el servidor.</p>
          <span class="decision-tag">F-03 · HU-07</span>
        </aside>
      </div>
    `;
  }

  return `
    <div class="scenario-grid" data-defense-student-id="">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>Mi defensa</span></div>
        <h4>Estado de autorización</h4>
        <p>Estado actual del proceso:</p>
        <div class="empty-review" data-defense-state>Consultando...</div>
        <p class="decision-feedback" data-defense-feedback role="status">Consultando el estado en el servidor...</p>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Próximo paso</p>
        <strong>Estado de la defensa</strong>
        <p>La autorización se mostrará cuando el Profesor Guía complete la revisión final.</p>
      </aside>
    </div>
  `;
}

function validateDefenseState(data) {
  if (
    !data
    || typeof data.estado !== 'string'
    || typeof data.versionFinalRegistrada !== 'boolean'
    || typeof data.revisionFinalAprobada !== 'boolean'
    || typeof data.autorizacionEmitida !== 'boolean'
  ) {
    throw new Error('La respuesta del servidor no contiene el estado de defensa esperado.');
  }

  return data;
}

function updateRequirement(root, name, complete, completeText, pendingText) {
  const item = root.querySelector(`[data-requirement="${name}"]`);
  if (!item) return;

  item.classList.toggle('requirement-ok', complete);
  item.classList.toggle('requirement-pending', !complete);
  const status = item.querySelector('[data-requirement-status]');
  if (status) status.textContent = complete ? completeText : pendingText;
}

function displayDefenseState(root, state) {
  root.querySelectorAll('[data-defense-state]').forEach((element) => {
    element.textContent = state.estado;
  });

  updateRequirement(
    root,
    'final',
    state.versionFinalRegistrada,
    'Registrada',
    'Pendiente'
  );
  updateRequirement(
    root,
    'review',
    state.revisionFinalAprobada,
    'Aprobada',
    'Pendiente'
  );
  updateRequirement(
    root,
    'authorization',
    state.autorizacionEmitida,
    'Emitido',
    'Pendiente'
  );

  const action = root.querySelector('[data-approval-action]');
  if (action) {
    action.disabled = state.autorizacionEmitida
      || !state.versionFinalRegistrada
      || !state.revisionFinalAprobada;
    action.textContent = state.autorizacionEmitida
      ? 'Visto bueno emitido'
      : 'Emitir visto bueno';
    action.classList.toggle('is-complete', state.autorizacionEmitida);
  }
}

function getStudentId(root) {
  const selectedOption = root.querySelector('#reviewAdvance option:checked');
  const id = selectedOption?.dataset.studentId
    || root.querySelector('[data-defense-student-id]')?.dataset.defenseStudentId
    || activeStudentId();
  if (!/^\d{8,9}-[\dKk]$/.test(id)) {
    throw new Error('No se pudo determinar la memoria que se está autorizando.');
  }

  return id;
}

async function loadDefenseState(root, studentId) {
  const feedback = root.querySelector('[data-defense-feedback]');
  const action = root.querySelector('[data-approval-action]');
  if (action) action.disabled = true;

  try {
    const state = validateDefenseState(
      await get(`${DEFENSE_API_PATH}/${encodeURIComponent(studentId)}`)
    );
    displayDefenseState(root, state);

    if (feedback) {
      feedback.style.color = 'var(--muted)';
      if (state.autorizacionEmitida) {
        feedback.textContent = 'La autorización está registrada.';
      } else if (!state.versionFinalRegistrada) {
        feedback.textContent = 'Aún no se ha registrado la versión final del documento.';
      } else if (!state.revisionFinalAprobada) {
        feedback.textContent = 'La revisión de la versión final aún no está aprobada.';
      } else {
        feedback.textContent = 'Los requisitos están cumplidos. El Profesor Guía puede emitir el visto bueno.';
      }
    }
  } catch (error) {
    root.querySelectorAll('[data-defense-state]').forEach((element) => {
      element.textContent = 'No disponible';
    });
    if (feedback) {
      feedback.style.color = '#c0392b';
      feedback.textContent = `No se pudo consultar el estado de defensa: ${error.message}`;
    }
  }
}

function bindReviewerEvents(root) {
  const studentSelect = root.querySelector('#correfStudentSelect');
  const gradeInput = root.querySelector('#correfGrade');
  const notesInput = root.querySelector('#correfNotes');
  const submitBtn = root.querySelector('#submitCorrefEval');
  const feedback = root.querySelector('#correfFeedback');
  const docTitle = root.querySelector('#correfDocTitle');
  const docMeta = root.querySelector('#correfDocMeta');
  const docStatus = root.querySelector('#correfDocStatus');
  const openReport = root.querySelector('#correfOpenReport');

  if (!studentSelect || !gradeInput || !notesInput || !submitBtn || !feedback) return;

  let students = [];
  let selectedStudent = null;

  const renderStudentOptions = () => {
    studentSelect.innerHTML = '<option value="">Selecciona un memorista</option>' + students.map((s) => (
      `<option value="${s.estudianteId}">${s.nombre} · Informe final disponible</option>`
    )).join('');
  };

  const updateSelected = () => {
    selectedStudent = students.find((s) => s.estudianteId === studentSelect.value) || null;
    const hasFinalReport = Boolean(selectedStudent?.avanceId);

    if (docTitle) docTitle.textContent = selectedStudent?.archivoFinal || selectedStudent?.nombre || 'Selecciona un memorista';
    if (docMeta) {
      docMeta.textContent = hasFinalReport
        ? `Informe final de ${selectedStudent.nombre}`
        : (selectedStudent ? 'Este memorista aún no ha subido su informe final.' : 'Los informes finales disponibles se mostrarán aquí.');
    }
    if (docStatus) {
      docStatus.textContent = hasFinalReport
        ? (selectedStudent.notaCorreferente == null ? 'Por evaluar' : 'Evaluado')
        : 'Pendiente';
    }
    if (openReport) {
      openReport.style.display = hasFinalReport ? 'inline-block' : 'none';
      openReport.href = hasFinalReport ? `/api/avances/${encodeURIComponent(selectedStudent.avanceId)}/descargar` : '#';
    }

    gradeInput.disabled = !hasFinalReport;
    notesInput.disabled = !hasFinalReport;
    submitBtn.disabled = !hasFinalReport;
    submitBtn.textContent = selectedStudent?.notaCorreferente == null ? 'Registrar evaluación' : 'Actualizar evaluación';
    gradeInput.value = selectedStudent?.notaCorreferente ?? '';
    notesInput.value = selectedStudent?.comentariosCorreferente ?? '';
    feedback.textContent = hasFinalReport
      ? (selectedStudent.notaCorreferente == null ? 'Informe final listo para evaluar.' : 'Evaluación previa encontrada; puedes actualizarla.')
      : (selectedStudent ? 'El memorista debe subir su informe final.' : 'Selecciona un memorista asignado.');
    feedback.style.color = 'var(--muted)';
  };

  const user = getCurrentUser();
  const correferenteId = user?.rolUniversitario || user?.rut || '';
  const url = correferenteId ? `/api/defensas/aptos?correferenteId=${encodeURIComponent(correferenteId)}` : '/api/defensas/aptos';

  const loadStudents = (preserveSelectionId = null) => {
    return get(url)
      .then((result) => {
        students = Array.isArray(result) ? result : [];
        renderStudentOptions();
        if (preserveSelectionId && students.some((s) => s.estudianteId === preserveSelectionId)) {
          studentSelect.value = preserveSelectionId;
        }
        updateSelected();
        feedback.textContent = students.length
          ? `${students.length} memorista${students.length === 1 ? '' : 's'} asignado${students.length === 1 ? '' : 's'}.`
          : 'No tienes memoristas asignados pendientes de evaluar.';
      })
      .catch((err) => {
        feedback.textContent = `Error al cargar memoristas: ${err.message}`;
        feedback.style.color = '#c0392b';
      });
  };

  loadStudents();
  studentSelect.addEventListener('change', updateSelected);
  window.addEventListener('advance:created', () => {
    loadStudents(studentSelect.value);
  });

  submitBtn.addEventListener('click', async () => {
    const nota = gradeInput.value.trim() === '' ? NaN : Number(gradeInput.value);
    const comentarios = notesInput.value.trim();
    const estudianteId = selectedStudent?.estudianteId;

    if (!selectedStudent?.avanceId) return;
    if (Number.isNaN(nota) || nota < 0 || nota > 100) {
      feedback.textContent = 'Ingresa una nota válida de 0 a 100.';
      feedback.style.color = '#c0392b';
      return;
    }
    if (!comentarios) {
      feedback.textContent = 'Ingresa tus observaciones del informe final.';
      feedback.style.color = '#c0392b';
      return;
    }

    submitBtn.disabled = true;
    feedback.textContent = 'Guardando evaluación...';
    try {
      await post('/api/evaluaciones/correferente', {
        estudianteId,
        correferenteId,
        nota,
        comentarios,
        acuerdoDefensa: nota >= 70
      });

      feedback.textContent = nota >= 70 ? 'Evaluación registrada con visto bueno.' : 'Evaluación registrada (nota < 70).';
      feedback.style.color = 'var(--teal)';
      await loadStudents(estudianteId);
    } catch (err) {
      feedback.textContent = `Error: ${err.message}`;
      feedback.style.color = '#c0392b';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

export function bindDefenseEvents(root = document) {
  if (root.querySelector('#correfStudentSelect')) {
    bindReviewerEvents(root);
    return;
  }

  const panel = root.querySelector('[data-defense-student-id]');
  if (!panel) return;

  let studentId;
  try {
    studentId = getStudentId(root);
  } catch (error) {
    const feedback = root.querySelector('[data-defense-feedback]');
    if (feedback) {
      feedback.style.color = '#c0392b';
      feedback.textContent = error.message;
    }
    return;
  }

  root.addEventListener('advance:selected', (event) => {
    if (!event.detail?.estudianteId) return;
    loadDefenseState(root, event.detail.estudianteId);
  });

  loadDefenseState(root, studentId);

  const action = root.querySelector('[data-approval-action]');
  if (!action) return;

  root.addEventListener('review:created', (event) => {
    if (event.detail.avanceId) loadDefenseState(root, studentId);
  });

  action.addEventListener('click', async () => {
    const feedback = root.querySelector('[data-defense-feedback]');
    action.disabled = true;
    action.textContent = 'Enviando autorización...';
    if (feedback) {
      feedback.style.color = 'var(--muted)';
      feedback.textContent = 'El servidor está verificando los requisitos...';
    }

    try {
      const state = validateDefenseState(
        await post(
          `${DEFENSE_API_PATH}/${encodeURIComponent(studentId)}/autorizacion`,
          {},
          { headers: { 'Content-Type': 'application/json', 'x-role': 'guide' } }
        )
      );
      displayDefenseState(root, state);

      if (feedback) {
        if (state.autorizacionEmitida && state.notificacionesRegistradas === 2) {
          feedback.style.color = 'var(--teal)';
          feedback.textContent = 'Visto bueno registrado. Jefatura de Carrera y Secretaría fueron notificadas.';
        } else if (state.autorizacionEmitida) {
          feedback.style.color = '#c0392b';
          feedback.textContent = 'El servidor registró la autorización, pero no confirmó las dos notificaciones. Verifica el estado antes de reintentar.';
        } else {
          feedback.style.color = '#c0392b';
          feedback.textContent = 'El servidor respondió sin confirmar la autorización.';
        }
      }
    } catch (error) {
      await loadDefenseState(root, studentId);
      if (feedback) {
        feedback.style.color = '#c0392b';
        feedback.textContent = `No se pudo emitir el visto bueno: ${error.message}`;
      }
    }
  });
}