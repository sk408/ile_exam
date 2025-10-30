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
  
  if (guideContainer) {
    fetch('content.json')
      .then((r) => r.json())
      .then((data) => {
        renderGuide(data.sections);
      })
      .catch((err) => {
        console.error('Failed to load study content:', err);
        guideContainer.innerHTML = '<p>Failed to load study content.</p>';
      });
  }

  function renderGuide(sections) {
    if (!guideContainer) return;
    
    guideContainer.innerHTML = '';
    sections.forEach((sec) => {
      const el = document.createElement('div');
      el.className = 'section';
      
      const h = document.createElement('h3');
      h.textContent = sec.title;
      h.addEventListener('click', () => el.classList.toggle('open'));
      
      const c = document.createElement('div');
      c.className = 'content';
      
      // Render subsections with detailed content
      if (sec.subsections && sec.subsections.length) {
        sec.subsections.forEach((subsec) => {
          const subHeading = document.createElement('h4');
          subHeading.textContent = subsec.heading;
          c.appendChild(subHeading);
          
          const ul = document.createElement('ul');
          (subsec.content || []).forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = item; // Use innerHTML to support bold, italic formatting
            ul.appendChild(li);
          });
          c.appendChild(ul);
        });
      }
      
      el.appendChild(h);
      el.appendChild(c);
      guideContainer.appendChild(el);
    });
    
    // Open first section by default
    const first = guideContainer.querySelector('.section');
    if (first) first.classList.add('open');
  }

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
  const timerDisplay = document.getElementById('timer-display');

  let bank = [];
  let exam = [];
  let responses = new Map();
  let idx = 0;
  let submitted = false;
  let startTime = null;
  let timerInterval = null;
  let examTimeLimit = 0; // in seconds

  async function loadExamBank() {
    // Load five section banks (60 items each = 300 total) and merge
    const files = [
      'exam_section1.json',
      'exam_section2.json',
      'exam_section3.json',
      'exam_section4.json',
      'exam_section5.json',
    ];
    const all = [];
    try {
      for (const f of files) {
        const resp = await fetch(f);
        if (!resp.ok) {
          console.error(`Failed to load ${f}:`, resp.status);
          continue;
        }
        const data = await resp.json();
        if (data && data.items && Array.isArray(data.items)) {
          all.push(...data.items);
        } else {
          console.error(`Invalid data format in ${f}`);
        }
      }
      bank = all;
      console.log(`Loaded ${bank.length} questions from ${files.length} files`);
    } catch (error) {
      console.error('Error loading exam bank:', error);
      alert('Failed to load exam questions. Please refresh the page.');
    }
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, examTimeLimit - elapsed);
      
      let display = `Time elapsed: ${formatTime(elapsed)}`;
      if (examTimeLimit > 0) {
        display += ` | Remaining: ${formatTime(remaining)}`;
        const avgTime = Math.ceil(elapsed / (idx + 1));
        const targetTime = Math.ceil(examTimeLimit / exam.length);
        display += ` | Avg: ${avgTime}s/q (target: ${targetTime}s/q)`;
        
        if (remaining === 0) {
          clearInterval(timerInterval);
          alert('Time is up! Submitting exam...');
          if (!submitted) submitBtn.click();
        }
      }
      
      if (timerDisplay) timerDisplay.textContent = display;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
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
    if (!exam || !exam.length || i < 0 || i >= exam.length) return;
    
    const q = exam[i];
    if (!q || !q.question || !q.choices || !Array.isArray(q.choices)) {
      console.error('Invalid question data at index', i, q);
      return;
    }
    
    // Randomize choices for this question (if not already shuffled)
    if (!q.shuffledChoices) {
      const choicesWithIndex = q.choices.map((choice, idx) => ({ choice, originalIdx: idx }));
      
      // Fisher-Yates shuffle
      for (let i = choicesWithIndex.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choicesWithIndex[i], choicesWithIndex[j]] = [choicesWithIndex[j], choicesWithIndex[i]];
      }
      
      q.shuffledChoices = choicesWithIndex.map(item => item.choice);
      q.shuffledAnswerIndex = choicesWithIndex.findIndex(item => item.originalIdx === q.answerIndex);
    }
    
    examStatus.textContent = `Question ${i + 1} of ${exam.length}`;
    examQ.textContent = q.question;
    examChoices.innerHTML = '';
    
    q.shuffledChoices.forEach((c, idxChoice) => {
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
      const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
      if (responses.get(q.id) === correctIdx) correct++;
    });
    return { correct, total: exam.length };
  }

  function showResults() {
    stopTimer();
    const { correct, total } = computeScore();
    const pct = Math.round((100 * correct) / total);
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const passThreshold = Math.ceil(total * 0.75); // 75% to pass
    const passed = correct >= passThreshold ? 'PASSED' : 'FAILED';
    const passClass = correct >= passThreshold ? 'correct' : 'incorrect';
    
    examResults.classList.remove('hidden');
    examResults.innerHTML = `
      <h3>Results: ${correct}/${total} (${pct}%) - <span class="${passClass}">${passed}</span></h3>
      <p>Time taken: ${formatTime(elapsed)} | Questions answered: ${responses.size}/${total}</p>
      <p><em>Passing requires 75% (${passThreshold}/${total}). Pacing target: ~${Math.ceil(examTimeLimit/total)}s per question.</em></p>
    `;
    exam.forEach((q, i) => {
      const user = responses.get(q.id);
      const item = document.createElement('div');
      item.className = 'result-item';
      const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
      const statusClass = user === correctIdx ? 'correct' : 'incorrect';
      const statusText = user === correctIdx ? 'Correct' : 'Incorrect';
      const userTxt = user != null ? (q.shuffledChoices ? q.shuffledChoices[user] : q.choices[user]) : 'No answer';
      const correctTxt = q.choices[q.answerIndex]; // Always show original correct answer text
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

  // Only add event listeners if all required elements exist
  if (startExamBtn && examLenSel && examPanel && examResults && reviewExamBtn && 
      prevQBtn && nextQBtn && submitBtn && resetExamBtn) {
    
    startExamBtn.addEventListener('click', async () => {
      if (!bank.length) await loadExamBank();
      const n = parseInt(examLenSel.value, 10);
      exam = sample(bank, Math.min(n, bank.length));
      responses = new Map();
      idx = 0;
      submitted = false;
      
      // Set time limit: 105 questions = 120 minutes (7200 seconds), scale proportionally
      examTimeLimit = n === 105 ? 7200 : Math.ceil((7200 / 105) * n);
      
      examPanel.classList.remove('hidden');
      examResults.classList.add('hidden');
      reviewExamBtn.disabled = true;
      renderQuestion(idx);
      startTimer();
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
      stopTimer();
      exam = [];
      responses = new Map();
      idx = 0;
      submitted = false;
      startTime = null;
      examPanel.classList.add('hidden');
      examResults.classList.add('hidden');
      reviewExamBtn.disabled = true;
      if (timerDisplay) timerDisplay.textContent = '';
    });
  } else {
    console.error('Exam elements not found. Missing:', {
      startExamBtn: !!startExamBtn,
      examLenSel: !!examLenSel,
      examPanel: !!examPanel,
      examResults: !!examResults,
      reviewExamBtn: !!reviewExamBtn,
      prevQBtn: !!prevQBtn,
      nextQBtn: !!nextQBtn,
      submitBtn: !!submitBtn,
      resetExamBtn: !!resetExamBtn
    });
  }
})();


