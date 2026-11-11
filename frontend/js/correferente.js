import { apiUrl, get, post } from './api.js';
import { getCurrentUser } from './auth.js';

export function renderCorreferenteView() {
  return `
    <div class="scenario-grid">
      <section class="interaction-panel review-panel">
        <div class="panel-topline"><span class="story-symbol">08</span><span>HU-08 · Evaluación Correferente</span></div>
        
        <div class="review-document" id="correfDocument">
          <span class="file-icon">PDF</span>
          <div>
            <strong id="correfDocTitle">Selecciona un memorista</strong>
            <small id="correfDocMeta">Los informes finales disponibles se mostrarán aquí.</small>
          </div>
          <span class="review-status" id="correfDocStatus">Pendiente</span>
          <a class="action-button" id="correfOpenReport" href="#" target="_blank" rel="noopener" hidden>Abrir informe final</a>
        </div>

        <div style="margin: 16px 0;">
          <label class="field-label" for="correfStudentSelect">Memorista</label>
          <select id="correfStudentSelect" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; font-family: inherit; margin-top: 6px; font-size: 14px; color: var(--ink);">
            <option value="">Cargando memoristas...</option>
          </select>
        </div>

        <div style="margin: 16px 0;">
          <label class="field-label" for="correfGrade">Calificación informe escrito (Escala 0 a 100 · Aprobación mínima: 70)</label>
          <input type="number" id="correfGrade" min="0" max="100" step="1" placeholder="Ej: 85" style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 4px; font-size: 14px; color: var(--ink); background: #f8faf7;">
        </div>

        <label class="field-label" for="correfNotes">Dictamen y observaciones para el examen de título</label>
        <textarea id="correfNotes" rows="5" placeholder="Indica observaciones metodológicas, correcciones previas a la defensa y si estás de acuerdo con autorizar el paso al examen oral..."></textarea>

        <div class="decision-actions">
          <button class="action-button" id="submitCorrefEval" type="button" disabled>Registrar evaluación</button>
        </div>
        <p class="decision-feedback" id="correfFeedback" role="status">Solo se puede evaluar a un memorista después de que suba su informe final.</p>
      </section>
    </div>
  `;
}

export function bindCorreferenteEvents(root = document) {
  const studentSelect = root.querySelector('#correfStudentSelect');
  const gradeInput = root.querySelector('#correfGrade');
  const notesInput = root.querySelector('#correfNotes');
  const submitBtn = root.querySelector('#submitCorrefEval');
  const feedback = root.querySelector('#correfFeedback');
  const documentTitle = root.querySelector('#correfDocTitle');
  const documentMeta = root.querySelector('#correfDocMeta');
  const documentStatus = root.querySelector('#correfDocStatus');
  const openReport = root.querySelector('#correfOpenReport');

  if (!studentSelect || !gradeInput || !notesInput || !submitBtn || !feedback) return;

  let students = [];
  let selectedStudent = null;

  const renderStudentOptions = () => {
    studentSelect.innerHTML = '<option value="">Selecciona un memorista</option>' + students.map((student) => (
      `<option value="${escapeHtml(student.estudianteId)}">${escapeHtml(student.nombre)} · Informe final disponible</option>`
    )).join('');
  };

  submitBtn.disabled = true;
  gradeInput.disabled = true;
  notesInput.disabled = true;
  feedback.textContent = 'Cargando memoristas asignados desde la base de datos...';

  const updateSelectedStudent = () => {
    selectedStudent = students.find((student) => student.estudianteId === studentSelect.value) || null;
    const hasFinalReport = Boolean(selectedStudent?.avanceId);

    if (documentTitle) {
      documentTitle.textContent = selectedStudent?.archivoFinal || selectedStudent?.nombre || 'Selecciona un memorista';
    }
    if (documentMeta) {
      documentMeta.textContent = hasFinalReport
        ? `Informe final de ${selectedStudent.nombre} · ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(selectedStudent.fechaEntrega))}`
        : selectedStudent
          ? 'Este memorista todavía no ha subido un informe final.'
          : 'Los informes finales disponibles se mostrarán aquí.';
    }
    if (documentStatus) {
      documentStatus.textContent = hasFinalReport
        ? selectedStudent.notaCorreferente == null ? 'Por evaluar' : 'Evaluado'
        : 'Informe pendiente';
    }
    if (openReport) {
      openReport.hidden = !hasFinalReport;
      openReport.href = hasFinalReport
        ? apiUrl(`/api/avances/${encodeURIComponent(selectedStudent.avanceId)}/descargar`)
        : '#';
    }

    gradeInput.disabled = !hasFinalReport;
    notesInput.disabled = !hasFinalReport;
    submitBtn.disabled = !hasFinalReport;
    submitBtn.textContent = selectedStudent?.notaCorreferente == null ? 'Registrar evaluación' : 'Actualizar evaluación';
    gradeInput.value = selectedStudent?.notaCorreferente ?? '';
    notesInput.value = selectedStudent?.comentariosCorreferente ?? '';
    feedback.textContent = hasFinalReport
      ? selectedStudent.notaCorreferente == null
        ? 'El informe final está disponible para evaluación.'
        : 'Este informe final ya tiene una evaluación registrada; puedes actualizarla.'
      : selectedStudent
        ? 'La evaluación se habilitará cuando el memorista suba su informe final.'
        : 'Selecciona un memorista para consultar su estado.';
    feedback.style.color = 'var(--muted)';
  };

  const user = getCurrentUser();
  const correferenteId = user?.rolUniversitario || user?.rut || '';
  const url = correferenteId
    ? `/api/defensas/aptos?correferenteId=${encodeURIComponent(correferenteId)}`
    : '/api/defensas/aptos';

  const loadStudents = (preserveSelectionId = null) => {
    return get(url)
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error('La API devolvió un listado de memoristas inválido.');
        }

        students = result;
        renderStudentOptions();

        if (preserveSelectionId && students.some((s) => s.estudianteId === preserveSelectionId)) {
          studentSelect.value = preserveSelectionId;
        }

        updateSelectedStudent();
        feedback.textContent = students.length
          ? `${students.length} memorista${students.length === 1 ? '' : 's'} asignado${students.length === 1 ? '' : 's'}.`
          : 'No tienes memoristas asignados pendientes de evaluar.';
      })
      .catch((error) => {
        studentSelect.innerHTML = '<option value="">No se pudo cargar el listado</option>';
        feedback.textContent = `No se pudieron cargar los memoristas: ${error.message}`;
        feedback.style.color = '#c0392b';
      });
  };

  loadStudents();
  studentSelect.addEventListener('change', updateSelectedStudent);

  window.addEventListener('advance:created', () => {
    loadStudents(studentSelect.value);
  });

  submitBtn.addEventListener('click', async () => {
    const estudianteId = selectedStudent?.estudianteId;
    const nota = gradeInput.value.trim() === '' ? NaN : Number(gradeInput.value);
    const comentarios = notesInput.value.trim();

    if (!selectedStudent?.avanceId) {
      feedback.textContent = 'El memorista debe subir su informe final antes de ser evaluado.';
      feedback.style.color = '#c0392b';
      return;
    }
    if (!Number.isInteger(nota) || nota < 0 || nota > 100) {
      feedback.textContent = 'Ingresa una calificación válida en escala de 0 a 100.';
      feedback.style.color = '#c0392b';
      return;
    }

    if (!comentarios) {
      feedback.textContent = 'Ingresa las observaciones o dictamen para el memorista.';
      feedback.style.color = '#c0392b';
      return;
    }

    submitBtn.disabled = true;
    feedback.textContent = 'Registrando evaluación...';
    feedback.style.color = 'var(--muted)';

    try {
      await post('/api/evaluaciones/correferente', {
        estudianteId,
        avanceId: selectedStudent.avanceId,
        correferenteId,
        nota,
        comentarios,
        acuerdoDefensa: nota >= 70
      });

      feedback.textContent = nota >= 70
        ? 'Evaluación registrada: Visto bueno otorgado para defensa.'
        : 'Evaluación registrada con nota reprobatoria (< 70).';
      feedback.style.color = 'var(--teal)';
      await loadStudents(estudianteId);
    } catch (err) {
      feedback.textContent = `Error al registrar: ${err.message}`;
      feedback.style.color = '#c0392b';
    } finally {
      submitBtn.disabled = !selectedStudent?.avanceId;
    }
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}