document.querySelectorAll('.option-card').forEach(card => {
  card.addEventListener('click', () => {
    const mode = card.getAttribute('data-mode');
    localStorage.setItem('asistenteModo', mode);
    window.location.href = "../asistente-ia/asistente-ia.html";
  });
});
