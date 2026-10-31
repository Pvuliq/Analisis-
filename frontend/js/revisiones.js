export function renderReviews(isGuide) {
  if (isGuide) {
    return `
      <div class="scenario-grid">
        <section class="interaction-panel review-panel">
          <div class="panel-topline"><span class="story-symbol">02</span><span>HU-02 · Revisión docente</span></div>
          <div class="review-document"><span class="file-icon">PDF</span><div><strong>Avance_memoria_v03.pdf</strong><small>Entregado hoy · versión específica</small></div><span class="review-status">Revisado</span></div>
          <label class="field-label" for="reviewNotes">Observaciones para el memorista</label>
          <textarea id="reviewNotes" rows="4" placeholder="Escribe las correcciones y comentarios de esta versión..."></textarea>
          <div class="decision-actions"><button class="action-button review-decision" type="button">Avance suficiente</button><button class="secondary-button review-decision" type="button">Necesita correcciones</button></div>
          <p class="decision-feedback" id="reviewFeedback">Indica si esta versión cumple con el estándar esperado.</p>
        </section>
        <aside class="evidence-panel"><p class="section-label">Estado de la revisión</p><strong id="reviewState">Revisado</strong><p>Las observaciones quedan vinculadas a esta versión y se notifica al estudiante.</p><span class="decision-tag">F-01 · HU-02</span></aside>
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
  root.querySelectorAll('.review-decision').forEach((button) => {
    button.addEventListener('click', () => {
      const reviewState = root.querySelector('#reviewState');
      const reviewFeedback = root.querySelector('#reviewFeedback');

      if (reviewState) reviewState.textContent = 'Revisado';
      if (reviewFeedback) {
        reviewFeedback.textContent = button.textContent === 'Avance suficiente'
          ? 'La versión cumple con el estándar esperado.'
          : 'Se notificará al memorista que debe realizar correcciones.';
      }

      root.querySelectorAll('.review-decision').forEach((item) => item.classList.remove('is-selected'));
      button.classList.add('is-selected');
    });
  });
}
