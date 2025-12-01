function toggleFAQ(question) {
    const answer = question.nextElementSibling;
    const symbol = question.querySelector('span');
      
    // Close all other FAQs
    document.querySelectorAll('.faq-answer').forEach(a => {
        if (a !== answer) {
          a.classList.remove('active');
          a.previousElementSibling.querySelector('span').textContent = '+';
        }
    });
      
    // Toggle current FAQ
    answer.classList.toggle('active');
    symbol.textContent = answer.classList.contains('active') ? '−' : '+';
}