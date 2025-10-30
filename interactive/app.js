/* ILE Interactive Study Guide - Vanilla JS */
(function () {
  const tabs = document.querySelectorAll('.tab-btn');
  const tabViews = document.querySelectorAll('.tab');

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      tabViews.forEach((v) => v.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
    });
  });

  // Load study content
  const guideContainer = document.getElementById('guide-sections');
  fetch('content.json')
    .then((r) => r.json())
    .then((data) => {
      renderGuide(data.sections);
      initFlashcards(data.flashcards || []);
    })
    .catch(() => {
      guideContainer.innerHTML = '<p>Failed to load study content.</p>';
    });

  function renderGuide(sections) {
    guideContainer.innerHTML = '';
    sections.forEach((sec) => {
      const el = document.createElement('div');
      el.className = 'section';
      const h = document.createElement('h3');
      h.textContent = sec.title;
      const c = document.createElement('div');
      c.className = 'content';
      const ul = document.createElement('ul');
      (sec.bullets || []).forEach((b) => {
        const li = document.createElement('li');
        li.textContent = b;
        ul.appendChild(li);
      });
      if (sec.keyNumbers && sec.keyNumbers.length) {
        const hn = document.createElement('h4');
        hn.textContent = 'Key Numbers';
        c.appendChild(hn);
        const ul2 = document.createElement('ul');
        sec.keyNumbers.forEach((n) => {
          const li = document.createElement('li');
          li.textContent = n;
          ul2.appendChild(li);
        });
        c.appendChild(ul2);
      }
      c.appendChild(ul);
      h.addEventListener('click', () => el.classList.toggle('open'));
      el.appendChild(h);
      el.appendChild(c);
      guideContainer.appendChild(el);
    });
    // Open first by default
    const first = guideContainer.querySelector('.section');
    if (first) first.classList.add('open');
  }

  // Flashcards
  let flashcards = [];
  let cardIndex = 0;
  const cardEl = document.getElementById('flashcard');
  const frontEl = cardEl.querySelector('.front');
  const backEl = cardEl.querySelector('.back');
  const prevCardBtn = document.getElementById('prev-card');
  const flipCardBtn = document.getElementById('flip-card');
  const nextCardBtn = document.getElementById('next-card');
  const cardProg = document.getElementById('flashcard-progress');

  function initFlashcards(cards) {
    flashcards = cards;
    cardIndex = 0;
    updateCard();
  }
  function updateCard() {
    if (!flashcards.length) {
      frontEl.textContent = 'No flashcards available.';
      backEl.textContent = '';
      cardProg.textContent = '';
      return;
    }
    const { front, back } = flashcards[cardIndex];
    frontEl.textContent = front;
    backEl.textContent = back;
    cardEl.classList.remove('flipped');
    cardProg.textContent = `${cardIndex + 1} / ${flashcards.length}`;
  }
  prevCardBtn.addEventListener('click', () => {
    cardIndex = (cardIndex - 1 + flashcards.length) % flashcards.length;
    updateCard();
  });
  nextCardBtn.addEventListener('click', () => {
    cardIndex = (cardIndex + 1) % flashcards.length;
    updateCard();
  });
  flipCardBtn.addEventListener('click', () => {
    cardEl.classList.toggle('flipped');
  });

  // Exam
  const startExamBtn = document.getElementById('start-exam');
  const reviewExamBtn = document.getElementById('review-exam');
  const resetExamBtn = document.getElementById('reset-exam');
  const examLenSel = document.getElementById('exam-length');
  const examPanel = document.getElementById('exam-panel');
  const examStatus = document.getElementById('exam-status');
  const examQ = document.getElementById('exam-question');
  const examChoices = document.getElementById('exam-choices');
  const examResults = document.getElementById('exam-results');
  const prevQBtn = document.getElementById('prev-q');
  const nextQBtn = document.getElementById('next-q');
  const submitBtn = document.getElementById('submit-exam');

  let bank = [];
  let exam = [];
  let responses = new Map();
  let idx = 0;
  let submitted = false;

  async function loadExamBank() {
    // Load five section banks (40 items each) and merge
    const files = [
      'exam_section1.json',
      'exam_section2.json',
      'exam_section3.json',
      'exam_section4.json',
      'exam_section5.json',
    ];
    const all = [];
    for (const f of files) {
      const resp = await fetch(f);
      const data = await resp.json();
      all.push(...data.items);
    }
    bank = all;
  }

  function sample(array, n) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  function renderQuestion(i) {
    const q = exam[i];
    if (!q) return;
    examStatus.textContent = `Question ${i + 1} of ${exam.length}`;
    examQ.textContent = q.question;
    examChoices.innerHTML = '';
    q.choices.forEach((c, idxChoice) => {
      const b = document.createElement('button');
      b.textContent = c;
      if (responses.get(q.id) === idxChoice) b.classList.add('selected');
      b.addEventListener('click', () => {
        responses.set(q.id, idxChoice);
        renderQuestion(i);
      });
      examChoices.appendChild(b);
    });
  }

  function computeScore() {
    let correct = 0;
    exam.forEach((q) => {
      if (responses.get(q.id) === q.answerIndex) correct++;
    });
    return { correct, total: exam.length };
  }

  function showResults() {
    const { correct, total } = computeScore();
    const pct = Math.round((100 * correct) / total);
    examResults.classList.remove('hidden');
    examResults.innerHTML = `<h3>Results: ${correct}/${total} (${pct}%)</h3>`;
    exam.forEach((q, i) => {
      const user = responses.get(q.id);
      const item = document.createElement('div');
      item.className = 'result-item';
      const statusClass = user === q.answerIndex ? 'correct' : 'incorrect';
      const statusText = user === q.answerIndex ? 'Correct' : 'Incorrect';
      const userTxt = user != null ? q.choices[user] : 'No answer';
      const correctTxt = q.choices[q.answerIndex];
      item.innerHTML = `
        <div class="${statusClass}"><strong>${statusText}</strong></div>
        <div><strong>Q${i + 1}.</strong> ${q.question}</div>
        <div><strong>Your answer:</strong> ${userTxt}</div>
        <div><strong>Correct answer:</strong> ${correctTxt}</div>
        <div><em>Rationale:</em> ${q.rationale}</div>
      `;
      examResults.appendChild(item);
    });
  }

  startExamBtn.addEventListener('click', async () => {
    if (!bank.length) await loadExamBank();
    const n = parseInt(examLenSel.value, 10);
    exam = sample(bank, Math.min(n, bank.length));
    responses = new Map();
    idx = 0;
    submitted = false;
    examPanel.classList.remove('hidden');
    examResults.classList.add('hidden');
    reviewExamBtn.disabled = true;
    renderQuestion(idx);
  });

  prevQBtn.addEventListener('click', () => {
    if (!exam.length) return;
    idx = Math.max(0, idx - 1);
    renderQuestion(idx);
  });
  nextQBtn.addEventListener('click', () => {
    if (!exam.length) return;
    idx = Math.min(exam.length - 1, idx + 1);
    renderQuestion(idx);
  });
  submitBtn.addEventListener('click', () => {
    if (!exam.length || submitted) return;
    submitted = true;
    reviewExamBtn.disabled = false;
    showResults();
  });
  reviewExamBtn.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
  resetExamBtn.addEventListener('click', () => {
    exam = [];
    responses = new Map();
    idx = 0;
    submitted = false;
    examPanel.classList.add('hidden');
    examResults.classList.add('hidden');
    reviewExamBtn.disabled = true;
  });
})();


