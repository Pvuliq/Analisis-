import { get, post, apiUrl } from './api.js';
import { getCurrentUser } from './auth.js';
const DEFENSE_API_PATH = '/api/defensas';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function activeStudentId() {
  const user = getCurrentUser();
  return user?.estudianteId || user?.rut || '';
}

function renderApprovalPanel() {
  return `
    <section class="interaction-panel approval-panel">
      <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Defensa</span></div>
      <h4>Checklist para autorizar defensa</h4>
      <p>El sistema comprobará los requisitos de la memoria antes de registrar la autorización.</p>
      <ul class="requirement-list">
        <li class="requirement-pending" data-requirement="final">
          <span>01</span>Versión final del documento: <strong data-requirement-status>Consultando...</strong>
        </li>
        <li class="requirement-pending" data-requirement="review">
          <span>02</span>Evaluación del correferente: <strong data-requirement-status>Consultando...</strong>
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

export function renderGuideReview() {
  return `
    <div class="review-only-layout" data-review-mode="guide" data-review-student-id="">
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
      </section>
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
        <section class="interaction-panel">
          <div class="panel-topline"><span class="story-symbol">03</span><span>HU-07 · Defensa</span></div>
          <h4>Seleccionar documento</h4>
          <p>Selecciona una entrega. El sistema solo autorizará documentos marcados como versión final.</p>
          <label class="field-label" for="defenseStudentSelect">Documento de memoria</label>
          <select id="defenseStudentSelect" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);">
            <option value="">Cargando documentos...</option>
          </select>
          <p class="decision-feedback" data-defense-selection-feedback role="status">Consultando documentos...</p>
        </section>
        ${renderApprovalPanel()}
      </div>
    `;
  }

  return `
    <div class="scenario-grid" data-defense-student-id="">
      <section class="interaction-panel">
        <div class="panel-topline"><span class="story-symbol">03</span><span>Mi defensa</span></div>
        <h4>Estado de autorización</h4>
        <p>Estado actual del proceso:</p>
        <div class="defense-status defense-status-pending" data-defense-state>
          <span class="defense-status-label">Estado actual</span>
          <strong>Consultando...</strong>
        </div>
        <p class="decision-feedback" data-defense-feedback role="status">Consultando el estado en el servidor...</p>
        <div class="defense-notification" data-corref-notifications>
          <span class="defense-notification-label">Notificación</span>
          <strong>Consultando notificaciones...</strong>
        </div>
      </section>
      <aside class="evidence-panel">
        <p class="section-label">Próximo paso</p>
        <strong>Estado de la defensa</strong>
        <p>La autorización se mostrará cuando el correferente apruebe el informe final y el Profesor Guía emita el visto bueno.</p>
      </aside>
    </div>
  `;
}

function validateDefenseState(data) {
  if (
    !data
    || typeof data.estado !== 'string'
    || typeof data.versionFinalRegistrada !== 'boolean'
    || typeof data.evaluacionCorreferenteRegistrada !== 'boolean'
    || typeof data.evaluacionCorreferenteAprobada !== 'boolean'
    || typeof data.autorizacionEmitida !== 'boolean'
  ) {
    throw new Error('La respuesta del servidor no contiene el estado de defensa esperado.');
  }

  return data;
}

function updateRequirement(root, name, complete, completeText, pendingText, rejected = false) {
  const item = root.querySelector(`[data-requirement="${name}"]`);
  if (!item) return;

  item.classList.toggle('requirement-ok', complete);
  item.classList.toggle('requirement-pending', !complete);
  item.classList.toggle('requirement-rejected', rejected);
  const status = item.querySelector('[data-requirement-status]');
  if (status) status.textContent = complete ? completeText : pendingText;
}

function displayDefenseState(root, state) {
  root.querySelectorAll('[data-defense-state]').forEach((element) => {
    element.classList.remove(
      'defense-status-pending',
      'defense-status-ready',
      'defense-status-approved',
      'defense-status-rejected'
    );
    const statusClass = state.autorizacionEmitida
      ? 'defense-status-approved'
      : state.evaluacionCorreferenteRegistrada && !state.evaluacionCorreferenteAprobada
        ? 'defense-status-rejected'
        : state.evaluacionCorreferenteAprobada
          ? 'defense-status-ready'
          : 'defense-status-pending';
    element.classList.add(statusClass);
    element.innerHTML = `<span class="defense-status-label">Estado actual</span><strong>${escapeHtml(state.estado)}</strong>`;
  });

  updateRequirement(
    root,
    'final',
    state.versionFinalRegistrada,
    'Registrada',
    state.avanceId ? 'No, marcado como no final' : 'Pendiente'
  );
  updateRequirement(
    root,
    'review',
    state.evaluacionCorreferenteAprobada,
    'Aprobada',
    !state.versionFinalRegistrada
      ? 'No aplica (documento no final)'
      : !state.evaluacionCorreferenteRegistrada
        ? 'Pendiente'
        : `No aprobada (nota: ${state.notaCorreferente})`,
    state.versionFinalRegistrada
      && state.evaluacionCorreferenteRegistrada
      && !state.evaluacionCorreferenteAprobada
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
      || !state.evaluacionCorreferenteAprobada;
    action.textContent = state.autorizacionEmitida
      ? 'Visto bueno emitido'
      : 'Emitir visto bueno';
    action.classList.toggle('is-complete', state.autorizacionEmitida);
  }
}

function displayNoDefenseStudent(root, message) {
  root.dataset.defenseStudentId = '';
  root.querySelectorAll('[data-defense-state]').forEach((element) => {
    element.textContent = 'Sin documento seleccionado';
  });
  ['final', 'review', 'authorization'].forEach((name) => {
    const item = root.querySelector(`[data-requirement="${name}"]`);
    if (!item) return;
    item.classList.remove('requirement-ok');
    item.classList.remove('requirement-rejected');
    item.classList.add('requirement-pending');
    const status = item.querySelector('[data-requirement-status]');
    if (status) status.textContent = 'Sin datos';
  });
  const action = root.querySelector('[data-approval-action]');
  if (action) action.disabled = true;
  const selectionFeedback = root.querySelector('[data-defense-selection-feedback]');
  if (selectionFeedback) {
    selectionFeedback.style.color = 'var(--muted)';
    selectionFeedback.textContent = message;
  }
  const feedback = getDefenseFeedback(root);
  if (feedback) {
    feedback.style.color = 'var(--muted)';
    feedback.textContent = message;
  }
}

function getDefenseFeedback(root) {
  return root.querySelector('.approval-panel [data-defense-feedback]')
    || root.querySelector('[data-defense-feedback]');
}

function getStudentId(root) {
  const defenseStudentSelect = root.querySelector('#defenseStudentSelect');
  const selectedOption = defenseStudentSelect?.selectedOptions[0];
  const id = defenseStudentSelect
    ? selectedOption?.dataset.studentId
    : root.querySelector('[data-defense-student-id]')?.dataset.defenseStudentId || activeStudentId();
  if (!/^\d{8,9}-[\dKk]$/.test(id)) {
    throw new Error('No se pudo determinar la memoria que se está autorizando.');
  }

  return id;
}

function getSelectedAdvanceId(root) {
  const value = root.querySelector('#defenseStudentSelect')?.value;
  const advanceId = Number(value);
  return Number.isInteger(advanceId) && advanceId > 0 ? advanceId : null;
}

async function loadDefenseState(root, studentId, advanceId = null) {
  const feedback = getDefenseFeedback(root);
  const action = root.querySelector('[data-approval-action]');
  if (action) action.disabled = true;
  if (feedback) {
    feedback.style.color = 'var(--muted)';
    feedback.textContent = 'Consultando los requisitos en el servidor...';
  }

  try {
    const state = validateDefenseState(
      await get(
        `${DEFENSE_API_PATH}/${encodeURIComponent(studentId)}`
        + (advanceId ? `?avanceId=${encodeURIComponent(advanceId)}` : '')
      )
    );
    const defenseStudentSelect = root.querySelector('#defenseStudentSelect');
    if (defenseStudentSelect && Number(defenseStudentSelect.value) !== advanceId) return;
    displayDefenseState(root, state);

    if (feedback) {
      feedback.style.color = 'var(--muted)';
      if (state.autorizacionEmitida) {
        feedback.textContent = 'La autorización está registrada.';
      } else if (!state.versionFinalRegistrada) {
        feedback.textContent = 'El documento seleccionado no está marcado como versión final. No se puede emitir el visto bueno.';
      } else if (!state.evaluacionCorreferenteRegistrada) {
        feedback.textContent = 'El correferente aún no ha evaluado la versión final.';
      } else if (!state.evaluacionCorreferenteAprobada) {
        feedback.textContent = `La evaluación del correferente no está aprobada (nota: ${state.notaCorreferente}).`;
      } else {
        feedback.textContent = 'El correferente aprobó el informe. El Profesor Guía puede emitir el visto bueno.';
      }
    }
  } catch (error) {
    const defenseStudentSelect = root.querySelector('#defenseStudentSelect');
    if (defenseStudentSelect && Number(defenseStudentSelect.value) !== advanceId) return;
    root.querySelectorAll('[data-defense-state]').forEach((element) => {
      element.textContent = 'No disponible';
    });
    const defenseFeedback = getDefenseFeedback(root);
    if (defenseFeedback) {
      defenseFeedback.style.color = '#c0392b';
      defenseFeedback.textContent = `No se pudo consultar el estado de defensa: ${error.message}`;
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

async function loadCorreferenteNotifications(root, studentId) {
  const container = root.querySelector('[data-corref-notifications]');
  if (!container) return;

  try {
    const notifications = await get(
      `${DEFENSE_API_PATH}/${encodeURIComponent(studentId)}/notificaciones-evaluacion`
    );
    if (!Array.isArray(notifications)) {
      throw new Error('El servidor devolvió una lista de notificaciones inválida.');
    }

    const latest = notifications[0];
    container.innerHTML = `
      <span class="defense-notification-label">Notificación</span>
      <strong>${escapeHtml(latest ? latest.mensaje : 'Aún no hay evaluaciones del correferente disponibles.')}</strong>
    `;
  } catch (error) {
    container.innerHTML = `
      <span class="defense-notification-label">Notificación</span>
      <strong>No se pudieron consultar las notificaciones: ${escapeHtml(error.message)}</strong>
    `;
  }
}

export function bindDefenseEvents(root = document) {
  if (root.querySelector('#correfStudentSelect')) {
    bindReviewerEvents(root);
    return;
  }

  const panel = root.querySelector('[data-defense-student-id]');
  if (!panel) return;

  const defenseStudentSelect = root.querySelector('#defenseStudentSelect');
  let initialStudentId;
  if (defenseStudentSelect) {
    displayNoDefenseStudent(root, 'Selecciona un documento para consultar los requisitos.');
  } else {
    try {
      initialStudentId = getStudentId(root);
    } catch (error) {
      const feedback = root.querySelector('[data-defense-feedback]');
      if (feedback) {
        feedback.style.color = '#c0392b';
        feedback.textContent = error.message;
      }
      return;
    }
  }

  if (initialStudentId) {
    loadDefenseState(root, initialStudentId);
    loadCorreferenteNotifications(root, initialStudentId);
  }

  if (defenseStudentSelect) {
    get(`${DEFENSE_API_PATH}/documentos`)
      .then((reports) => {
        if (!Array.isArray(reports)) {
          throw new Error('El servidor devolvió una lista de documentos inválida.');
        }

        defenseStudentSelect.replaceChildren(new Option('Selecciona un documento', ''));
        reports.forEach((report) => {
          const option = new Option(
            `${report.estudianteId} · ${report.nombreArchivo} · ${Number(report.esVersionFinal) === 1 ? 'Versión final' : 'No final'}`,
            report.avanceId
          );
          option.dataset.studentId = report.estudianteId;
          option.dataset.esVersionFinal = String(Number(report.esVersionFinal) === 1);
          defenseStudentSelect.add(option);
        });

        if (reports.length === 0) {
          defenseStudentSelect.replaceChildren(new Option('No hay documentos registrados', ''));
          displayNoDefenseStudent(root, 'No hay documentos registrados para revisar.');
        } else {
          displayNoDefenseStudent(root, 'Selecciona un documento para consultar los requisitos.');
        }
      })
      .catch((error) => {
        defenseStudentSelect.replaceChildren(new Option('No se pudieron cargar los documentos', ''));
        displayNoDefenseStudent(root, `No se pudieron cargar los documentos: ${error.message}`);
        const selectionFeedback = root.querySelector('[data-defense-selection-feedback]');
        if (selectionFeedback) selectionFeedback.style.color = '#c0392b';
      });

    defenseStudentSelect.addEventListener('change', () => {
      if (!defenseStudentSelect.value) {
        displayNoDefenseStudent(root, 'Selecciona un documento para consultar los requisitos.');
        return;
      }
      const studentId = getStudentId(root);
      const advanceId = getSelectedAdvanceId(root);
      root.dataset.defenseStudentId = studentId;
      loadDefenseState(root, studentId, advanceId);
    });
  }

  const action = root.querySelector('[data-approval-action]');
  if (!action) return;

  action.addEventListener('click', async () => {
    const feedback = getDefenseFeedback(root);
    let studentId;
    let advanceId;
    try {
      studentId = getStudentId(root);
      advanceId = getSelectedAdvanceId(root);
    } catch (error) {
      if (feedback) {
        feedback.style.color = '#c0392b';
        feedback.textContent = error.message;
      }
      return;
    }

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
          { avanceId: advanceId },
          { headers: { 'Content-Type': 'application/json', 'x-role': 'guide' } }
        )
      );
      if (defenseStudentSelect && Number(defenseStudentSelect.value) !== advanceId) return;
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
      if (defenseStudentSelect && Number(defenseStudentSelect.value) !== advanceId) return;
      await loadDefenseState(root, studentId, advanceId);
      if (feedback) {
        feedback.style.color = '#c0392b';
        feedback.textContent = `No se pudo emitir el visto bueno: ${error.message}`;
      }
    }
  });
}