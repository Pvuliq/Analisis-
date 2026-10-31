import { post } from './api.js';

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
      <section class="interaction-panel"><div class="panel-topline"><span class="story-symbol">02</span><span>Mis revisiones</span></div><h4>Observaciones del Profesor Guía</h4><p>Aquí aparecerán las correcciones asociadas a tus entregas cuando sean revisadas.</p><div class="empty-review">No hay observaciones nuevas para mostrar.</div></section>
      <aside class="evidence-panel"><p class="section-label">Estado</p><strong>En espera de revisión</strong><p>Recibirás una notificación cuando el profesor registre sus comentarios.</p></aside>
    </div>
  `;
}

export function bindReviewEvents(root = document) {
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
}