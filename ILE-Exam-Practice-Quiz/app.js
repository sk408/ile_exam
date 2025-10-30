// ILE Practice Exam Application
// State Management
const state = {
  currentMode: null,
  currentSection: null,
  currentQuestionIndex: 0,
  questions: [],
  answers: {},
  flaggedQuestions: new Set(),
  completedQuestions: new Set(),
  score: 0,
  totalAnswered: 0
};

// Sample questions data (in production, would load from external JSON)
const ALL_QUESTIONS = generateAllQuestions();

// Initialize application
function init() {
  showHome();
  updateStats();
}

// Screen Navigation
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showHome() {
  showScreen('homeScreen');
  updateStats();
}

function showSectionSelect() {
  showScreen('sectionScreen');
  updateSectionProgress();
}

function showRandomQuiz() {
  showScreen('randomScreen');
}

// Start Quiz Functions
function startSection(sectionNum) {
  state.currentMode = 'section';
  state.currentSection = sectionNum;
  state.currentQuestionIndex = 0;
  state.questions = ALL_QUESTIONS.filter(q => q.section === sectionNum);
  state.answers = {};
  state.score = 0;
  state.totalAnswered = 0;
  showScreen('questionScreen');
  displayQuestion();
}

function startRandomQuiz(count) {
  state.currentMode = 'random';
  state.currentSection = null;
  state.currentQuestionIndex = 0;
  
  // Shuffle and select random questions
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  state.questions = shuffled.slice(0, count);
  
  state.answers = {};
  state.score = 0;
  state.totalAnswered = 0;
  showScreen('questionScreen');
  displayQuestion();
}

function reviewFlagged() {
  if (state.flaggedQuestions.size === 0) {
    alert('You haven\'t flagged any questions yet!');
    return;
  }
  
  state.currentMode = 'flagged';
  state.currentSection = null;
  state.currentQuestionIndex = 0;
  state.questions = ALL_QUESTIONS.filter(q => state.flaggedQuestions.has(q.id));
  state.answers = {};
  state.score = 0;
  state.totalAnswered = 0;
  showScreen('questionScreen');
  displayQuestion();
}

function reviewMissed() {
  const missedQuestions = state.questions.filter((q, idx) => {
    const answer = state.answers[idx];
    const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answer_index;
    return answer !== undefined && answer !== correctIdx;
  });
  
  if (missedQuestions.length === 0) {
    alert('Perfect score! No questions to review.');
    return;
  }
  
  state.currentMode = 'review';
  state.currentQuestionIndex = 0;
  state.questions = missedQuestions;
  state.answers = {};
  state.score = 0;
  state.totalAnswered = 0;
  showScreen('questionScreen');
  displayQuestion();
}

function retakeQuiz() {
  const currentQuestions = [...state.questions];
  state.currentQuestionIndex = 0;
  state.questions = currentQuestions;
  state.answers = {};
  state.score = 0;
  state.totalAnswered = 0;
  showScreen('questionScreen');
  displayQuestion();
}

// Question Display
function displayQuestion() {
  const question = state.questions[state.currentQuestionIndex];
  if (!question) {
    showResults();
    return;
  }
  
  // Randomize choices for this question (if not already shuffled)
  if (!question.shuffledChoices) {
    const originalAnswerText = question.choices[question.answer_index];
    const choicesWithIndex = question.choices.map((choice, idx) => ({ choice, originalIdx: idx }));
    
    // Fisher-Yates shuffle
    for (let i = choicesWithIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choicesWithIndex[i], choicesWithIndex[j]] = [choicesWithIndex[j], choicesWithIndex[i]];
    }
    
    question.shuffledChoices = choicesWithIndex.map(item => item.choice);
    question.shuffledAnswerIndex = choicesWithIndex.findIndex(item => item.originalIdx === question.answer_index);
  }
  
  // Update header
  const sectionLabel = state.currentSection 
    ? `Section ${state.currentSection}` 
    : `Mixed Questions`;
  document.getElementById('questionSection').textContent = sectionLabel;
  document.getElementById('questionProgress').textContent = 
    `Question ${state.currentQuestionIndex + 1} of ${state.questions.length}`;
  
  // Update progress bar
  const progress = ((state.currentQuestionIndex) / state.questions.length) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;
  
  // Update score display
  const percentage = state.totalAnswered > 0 
    ? Math.round((state.score / state.totalAnswered) * 100) 
    : 0;
  document.getElementById('scoreDisplay').textContent = 
    `Score: ${state.score}/${state.totalAnswered} (${percentage}%)`;
  
  // Update flag button
  const flagIcon = document.getElementById('flagIcon');
  const flagBtn = document.getElementById('flagBtn');
  if (state.flaggedQuestions.has(question.id)) {
    flagIcon.textContent = '🚩';
    flagBtn.classList.add('flagged');
  } else {
    flagIcon.textContent = '🏴';
    flagBtn.classList.remove('flagged');
  }
  
  // Display question text
  document.getElementById('questionText').textContent = question.question;
  
  // Display shuffled choices
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  
  question.shuffledChoices.forEach((choice, index) => {
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice';
    choiceDiv.onclick = () => selectChoice(index);
    choiceDiv.innerHTML = `
      <span class="choice-letter">${letters[index]}</span>
      <span class="choice-text">${choice}</span>
    `;
    choicesContainer.appendChild(choiceDiv);
  });
  
  // Reset feedback and buttons
  document.getElementById('feedback').style.display = 'none';
  document.getElementById('submitBtn').style.display = 'inline-block';
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('nextQuestionBtn').style.display = 'none';
  document.getElementById('prevQuestionBtn').style.display = 
    state.currentQuestionIndex > 0 ? 'inline-block' : 'none';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectChoice(index) {
  // Only allow selection if not yet answered
  if (state.answers[state.currentQuestionIndex] !== undefined) return;
  
  // Remove previous selection
  document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
  
  // Add selection to clicked choice
  const choices = document.querySelectorAll('.choice');
  choices[index].classList.add('selected');
  
  // Enable submit button
  document.getElementById('submitBtn').disabled = false;
  
  // Store temporary selection (not yet submitted)
  window.tempSelection = index;
}

function submitAnswer() {
  const question = state.questions[state.currentQuestionIndex];
  const selectedIndex = window.tempSelection;
  
  if (selectedIndex === undefined) return;
  
  // Store answer
  state.answers[state.currentQuestionIndex] = selectedIndex;
  state.totalAnswered++;
  
  // Check if correct (use shuffled answer index)
  const correctIndex = question.shuffledAnswerIndex;
  const isCorrect = selectedIndex === correctIndex;
  if (isCorrect) {
    state.score++;
  }
  
  // Mark question as completed
  state.completedQuestions.add(question.id);
  
  // Update UI
  const choices = document.querySelectorAll('.choice');
  choices.forEach((choice, index) => {
    choice.classList.add('disabled');
    choice.onclick = null;
    
    if (index === correctIndex) {
      choice.classList.add('correct');
    }
    if (index === selectedIndex && !isCorrect) {
      choice.classList.add('incorrect');
    }
  });
  
  // Show feedback (use original correct answer text)
  const correctAnswerText = question.choices[question.answer_index];
  const feedbackDiv = document.getElementById('feedback');
  feedbackDiv.style.display = 'block';
  feedbackDiv.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  feedbackDiv.innerHTML = `
    <div class="feedback-header">
      <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
      <span>${isCorrect ? 'Correct!' : 'Incorrect'}</span>
    </div>
    <div class="feedback-rationale">
      <strong>Correct Answer: ${correctAnswerText}</strong><br><br>
      ${question.rationale}
    </div>
  `;
  
  // Update score display
  const percentage = Math.round((state.score / state.totalAnswered) * 100);
  document.getElementById('scoreDisplay').textContent = 
    `Score: ${state.score}/${state.totalAnswered} (${percentage}%)`;
  
  // Update buttons
  document.getElementById('submitBtn').style.display = 'none';
  document.getElementById('nextQuestionBtn').style.display = 'inline-block';
}

function nextQuestion() {
  state.currentQuestionIndex++;
  window.tempSelection = undefined;
  displayQuestion();
}

function previousQuestion() {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex--;
    window.tempSelection = undefined;
    displayQuestion();
  }
}

function toggleFlag() {
  const question = state.questions[state.currentQuestionIndex];
  if (state.flaggedQuestions.has(question.id)) {
    state.flaggedQuestions.delete(question.id);
  } else {
    state.flaggedQuestions.add(question.id);
  }
  displayQuestion();
  updateStats();
}

// Results Display
function showResults() {
  showScreen('resultsScreen');
  
  const percentage = Math.round((state.score / state.totalAnswered) * 100);
  
  // Update results header
  document.getElementById('finalScore').textContent = `${state.score}/${state.totalAnswered} (${percentage}%)`;
  
  // Determine performance level
  let performanceClass, performanceText, message;
  if (percentage >= 90) {
    performanceClass = 'excellent';
    performanceText = 'Excellent!';
    message = 'Outstanding! You\'re well-prepared for the exam.';
  } else if (percentage >= 80) {
    performanceClass = 'good';
    performanceText = 'Very Good!';
    message = 'Great work! Review missed questions to strengthen further.';
  } else if (percentage >= 70) {
    performanceClass = 'passing';
    performanceText = 'Passing';
    message = 'Good progress! Focus on sections with lower scores.';
  } else {
    performanceClass = 'needs-improvement';
    performanceText = 'Needs Improvement';
    message = 'Additional study recommended. Review explanations carefully.';
  }
  
  const performanceLabel = document.getElementById('performanceLabel');
  performanceLabel.className = `performance-label ${performanceClass}`;
  performanceLabel.textContent = performanceText;
  
  // Show section breakdown
  const breakdown = document.getElementById('resultsBreakdown');
  breakdown.innerHTML = `<h3>Performance Breakdown</h3><p>${message}</p>`;
  
  if (state.currentMode === 'random' || state.currentMode === 'review') {
    // Group by section
    const sectionScores = {};
    state.questions.forEach((q, idx) => {
      const section = q.section;
      if (!sectionScores[section]) {
        sectionScores[section] = { correct: 0, total: 0 };
      }
      sectionScores[section].total++;
      const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answer_index;
      if (state.answers[idx] === correctIdx) {
        sectionScores[section].correct++;
      }
    });
    
    const sectionNames = {
      1: 'Conduct Patient/Client Assessment',
      2: 'Interpret & Apply Assessment Results',
      3: 'Select Hearing Devices',
      4: 'Fit & Dispense Hearing Devices',
      5: 'Provide Continuing Care'
    };
    
    for (let section in sectionScores) {
      const score = sectionScores[section];
      const pct = Math.round((score.correct / score.total) * 100);
      breakdown.innerHTML += `
        <div class="section-result">
          <span class="section-result-name">Section ${section}: ${sectionNames[section]}</span>
          <span class="section-result-score">${score.correct}/${score.total} (${pct}%)</span>
        </div>
      `;
    }
  }
  
  // Show/hide review button based on missed questions
  const missedCount = state.questions.filter((q, idx) => {
    const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answer_index;
    return state.answers[idx] !== undefined && state.answers[idx] !== correctIdx;
  }).length;
  
  document.getElementById('reviewMissedBtn').style.display = 
    missedCount > 0 ? 'inline-block' : 'none';
}

// Stats and Progress
function updateStats() {
  document.getElementById('completedCount').textContent = state.completedQuestions.size;
  document.getElementById('flaggedCount').textContent = state.flaggedQuestions.size;
}

function updateSectionProgress() {
  for (let i = 1; i <= 5; i++) {
    const sectionQuestions = ALL_QUESTIONS.filter(q => q.section === i);
    const completed = sectionQuestions.filter(q => 
      state.completedQuestions.has(q.id)
    ).length;
    document.getElementById(`progress-${i}`).textContent = `${completed}/60`;
  }
}

// Generate all 300 questions
function generateAllQuestions() {
  const questions = [];
  let id = 1;
  
  // Section 1: Conduct Patient/Client Assessment (60 questions)
  const section1Questions = [
    { q: "Which is a red flag requiring medical referral before amplification?", c: ["Sudden unilateral hearing loss", "Stable bilateral presbycusis", "Intermittent difficulty in noise", "Cerumen partially visible"], a: 0, r: "Sudden unilateral loss is a classic medical red flag that warrants prompt referral to rule out serious pathology." },
    { q: "Normal hearing thresholds range from:", c: ["0-20 dB HL", "0-25 dB HL", "10-30 dB HL", "5-15 dB HL"], a: 0, r: "Normal hearing is defined as thresholds at or below 20 dB HL across all frequencies." },
    { q: "An air-bone gap of ≥15 dB suggests:", c: ["Conductive component", "Sensorineural loss", "Mixed loss", "Normal hearing"], a: 0, r: "A significant air-bone gap (≥15 dB) indicates a conductive component to the hearing loss." },
    { q: "Speech Reception Threshold (SRT) should correlate with Pure Tone Average (PTA) within:", c: ["±6 dB", "±10 dB", "±15 dB", "±3 dB"], a: 0, r: "SRT and PTA should agree within ±6 dB for valid test results." },
    { q: "Type B tympanogram indicates:", c: ["Flat, no peak - fluid or perforation", "Normal middle ear function", "Eustachian tube dysfunction", "Stiff system"], a: 0, r: "Type B tympanogram shows no peak and suggests middle ear effusion, perforation, or cerumen blockage." },
    { q: "Acoustic reflex thresholds are normally at:", c: ["85-100 dB HL", "70-85 dB HL", "100-115 dB HL", "60-75 dB HL"], a: 0, r: "Normal acoustic reflexes occur at 85-100 dB HL above threshold." },
    { q: "Bone conduction testing bypasses:", c: ["Outer and middle ear", "Inner ear", "Auditory nerve", "Cochlea"], a: 0, r: "Bone conduction testing assesses inner ear function by bypassing the outer and middle ear." },
    { q: "A patient reports unilateral tinnitus and hearing loss. You should:", c: ["Refer for medical evaluation", "Fit hearing aids immediately", "Schedule follow-up in 6 months", "Recommend hearing protection"], a: 0, r: "Unilateral tinnitus with hearing loss is a red flag requiring medical referral to rule out retrocochlear pathology." },
    { q: "Mild hearing loss in adults is defined as:", c: ["26-40 dB HL", "21-35 dB HL", "31-45 dB HL", "15-30 dB HL"], a: 0, r: "Adult mild hearing loss ranges from 26-40 dB HL by most standards." },
    { q: "Standard audiometric frequencies include:", c: ["250, 500, 1000, 2000, 4000, 8000 Hz", "125, 250, 500, 1000, 2000, 4000 Hz", "500, 1000, 1500, 2000, 3000, 4000 Hz", "250, 750, 1500, 3000, 6000 Hz"], a: 0, r: "Standard audiometric testing includes octave frequencies from 250-8000 Hz, with 3000 and 6000 Hz also tested." }
  ];
  
  // Generate 60 questions for each section
  const questionData = generateMoreQuestions();
  
  questionData.forEach((qData, index) => {
    questions.push({
      id: `Q${id}`,
      section: qData.section,
      question: qData.q,
      choices: qData.c,
      answer_index: qData.a,
      correct_answer: qData.c[qData.a],
      rationale: qData.r
    });
    id++;
  });
  
  return questions;
}

function generateMoreQuestions() {
  // This function returns all 300 questions across 5 sections
  return [
    // Section 1 (60 questions) - Conduct Patient/Client Assessment
    { section: 1, q: "Which is a red flag requiring medical referral?", c: ["Sudden unilateral hearing loss", "Stable bilateral presbycusis", "Intermittent difficulty in noise", "Partial cerumen"], a: 0, r: "Sudden unilateral loss warrants immediate medical referral." },
    { section: 1, q: "Normal hearing thresholds are:", c: ["≤20 dB HL", "≤25 dB HL", "≤15 dB HL", "≤30 dB HL"], a: 0, r: "Normal hearing is defined as ≤20 dB HL." },
    { section: 1, q: "An air-bone gap of ≥15 dB indicates:", c: ["Conductive component", "Sensorineural loss", "Normal variation", "Equipment error"], a: 0, r: "A gap ≥15 dB suggests conductive pathology." },
    { section: 1, q: "SRT should match PTA within:", c: ["±6 dB", "±10 dB", "±15 dB", "±3 dB"], a: 0, r: "SRT and PTA agreement within ±6 dB validates testing." },
    { section: 1, q: "Type B tympanogram suggests:", c: ["Flat - fluid or perforation", "Normal function", "Eustachian dysfunction", "Ossicular discontinuity"], a: 0, r: "Type B shows no peak, indicating fluid, perforation, or blockage." },
    { section: 1, q: "Acoustic reflex thresholds occur at:", c: ["85-100 dB HL", "70-85 dB HL", "100-115 dB HL", "60-75 dB HL"], a: 0, r: "Normal reflexes appear at 85-100 dB HL." },
    { section: 1, q: "Bone conduction bypasses:", c: ["Outer and middle ear", "Inner ear only", "Entire auditory system", "Cochlea"], a: 0, r: "BC testing directly stimulates the inner ear." },
    { section: 1, q: "Unilateral tinnitus requires:", c: ["Medical referral", "Immediate fitting", "6-month follow-up", "Hearing protection"], a: 0, r: "Unilateral tinnitus is a red flag for retrocochlear pathology." },
    { section: 1, q: "Adult mild hearing loss ranges:", c: ["26-40 dB HL", "21-35 dB HL", "31-45 dB HL", "15-30 dB HL"], a: 0, r: "Mild loss is typically 26-40 dB HL." },
    { section: 1, q: "Standard audiometric frequencies include:", c: ["250-8000 Hz octaves", "125-4000 Hz only", "500-6000 Hz only", "1000-8000 Hz only"], a: 0, r: "Testing includes octave frequencies 250-8000 Hz." },
    { section: 1, q: "Moderate hearing loss is defined as:", c: ["41-55 dB HL", "31-45 dB HL", "46-60 dB HL", "35-50 dB HL"], a: 0, r: "Moderate loss ranges from 41-55 dB HL." },
    { section: 1, q: "A Type A tympanogram indicates:", c: ["Normal middle ear", "Fluid present", "Eustachian dysfunction", "Perforation"], a: 0, r: "Type A shows normal peak at 0 daPa with normal compliance." },
    { section: 1, q: "Type C tympanogram shows peak at:", c: ["-50 to -100 daPa", "0 daPa", "+50 daPa", "-200 daPa"], a: 0, r: "Type C indicates negative pressure from Eustachian tube dysfunction." },
    { section: 1, q: "Otalgia (ear pain) requires:", c: ["Medical referral", "Hearing aid fitting", "Cerumen removal", "Retesting"], a: 0, r: "Ear pain is a contraindication requiring medical evaluation." },
    { section: 1, q: "Severe hearing loss ranges:", c: ["71-90 dB HL", "61-80 dB HL", "76-95 dB HL", "65-85 dB HL"], a: 0, r: "Severe loss is defined as 71-90 dB HL." },
    { section: 1, q: "Word Recognition Score (WRS) is presented at:", c: ["Suprathreshold (40 dB SL)", "Threshold level", "Most comfortable level", "Uncomfortable level"], a: 0, r: "WRS is typically tested at 40 dB sensation level." },
    { section: 1, q: "Asymmetrical loss >15 dB at 2 frequencies suggests:", c: ["Possible acoustic neuroma", "Normal aging", "Noise exposure", "Cerumen blockage"], a: 0, r: "Significant asymmetry warrants referral for retrocochlear evaluation." },
    { section: 1, q: "Profound hearing loss is:", c: [">90 dB HL", ">80 dB HL", ">100 dB HL", ">85 dB HL"], a: 0, r: "Profound loss exceeds 90 dB HL." },
    { section: 1, q: "Spondee words are used for:", c: ["Speech Reception Threshold", "Word Recognition Score", "Most Comfortable Level", "Uncomfortable Level"], a: 0, r: "Spondees (two-syllable words) determine SRT." },
    { section: 1, q: "Type As tympanogram indicates:", c: ["Stiff system (reduced compliance)", "Normal function", "Excessive compliance", "Fluid"], a: 0, r: "Type As shows reduced compliance, suggesting otosclerosis." },
    { section: 1, q: "A patient with ear drainage should:", c: ["Be referred medically", "Receive ear impressions", "Be fitted immediately", "Return in 2 weeks"], a: 0, r: "Otorrhea is a contraindication requiring medical clearance." },
    { section: 1, q: "Pure Tone Average (PTA) typically uses:", c: ["500, 1000, 2000 Hz", "250, 500, 1000 Hz", "1000, 2000, 4000 Hz", "500, 1000, 4000 Hz"], a: 0, r: "PTA averages the speech frequencies: 500, 1000, 2000 Hz." },
    { section: 1, q: "Infection control requires:", c: ["Disposable specula and sterilization", "Wiping with dry cloth", "Annual equipment cleaning", "Monthly disinfection"], a: 0, r: "Universal precautions include disposable specula and proper sterilization between patients." },
    { section: 1, q: "Type Ad tympanogram suggests:", c: ["Excessive compliance (hypermobile)", "Normal function", "Stiff system", "Fluid"], a: 0, r: "Type Ad shows excessive compliance, possibly from ossicular discontinuity." },
    { section: 1, q: "Moderately severe hearing loss is:", c: ["56-70 dB HL", "51-65 dB HL", "61-75 dB HL", "46-60 dB HL"], a: 0, r: "Moderately severe loss ranges 56-70 dB HL." },
    { section: 1, q: "A red or bulging tympanic membrane indicates:", c: ["Acute infection - refer immediately", "Normal variation", "Cerumen impaction", "Eustachian dysfunction"], a: 0, r: "Red, bulging TM suggests acute otitis media requiring medical treatment." },
    { section: 1, q: "Standard masking is used for:", c: ["Preventing cross-hearing", "Improving speech scores", "Reducing test time", "Validating results"], a: 0, r: "Masking prevents the non-test ear from responding." },
    { section: 1, q: "Sudden SNHL (>30 dB in 3 frequencies within 3 days) is:", c: ["A medical emergency", "Normal aging", "Noise-induced", "Temporary threshold shift"], a: 0, r: "Sudden SNHL requires immediate medical intervention." },
    { section: 1, q: "Normal tympanic membrane appears:", c: ["Pearly gray, translucent", "Red and inflamed", "Yellow with fluid", "White and opaque"], a: 0, r: "A healthy TM is pearly gray and translucent." },
    { section: 1, q: "The cone of light on TM is located:", c: ["Anterior-inferior quadrant", "Posterior-superior quadrant", "Center of membrane", "Superior pole"], a: 0, r: "The light reflex appears in the anterior-inferior quadrant." },
    { section: 1, q: "WRS <60% with mild loss suggests:", c: ["Retrocochlear pathology", "Normal finding", "Conductive loss", "Noise damage"], a: 0, r: "Disproportionately poor WRS warrants medical referral." },
    { section: 1, q: "Excessive cerumen impaction requires:", c: ["Medical removal or referral", "Immediate ear impressions", "Hearing aid fitting", "Home irrigation"], a: 0, r: "Significant cerumen must be removed by qualified personnel before testing." },
    { section: 1, q: "Tympanometry measures:", c: ["Middle ear compliance", "Hearing sensitivity", "Speech understanding", "Cochlear function"], a: 0, r: "Tympanometry assesses middle ear function via compliance and pressure." },
    { section: 1, q: "A notched audiometric pattern at 4000 Hz suggests:", c: ["Noise-induced hearing loss", "Presbycusis", "Meniere's disease", "Otosclerosis"], a: 0, r: "The classic 4000 Hz notch indicates noise exposure." },
    { section: 1, q: "Vertigo or dizziness requires:", c: ["Medical referral", "Balance exercises", "Hearing aid trial", "Observation"], a: 0, r: "Vestibular symptoms require medical evaluation." },
    { section: 1, q: "Air conduction tests:", c: ["Entire auditory pathway", "Inner ear only", "Middle ear only", "Outer ear only"], a: 0, r: "AC testing evaluates the complete auditory system." },
    { section: 1, q: "Insert earphones are preferred over headphones for:", c: ["Reducing occlusion effect", "Faster testing", "Better masking", "Patient comfort"], a: 0, r: "Insert earphones minimize occlusion and provide better inter-aural attenuation." },
    { section: 1, q: "A perforation in the tympanic membrane causes:", c: ["Conductive hearing loss", "Sensorineural loss", "Mixed loss", "No hearing loss"], a: 0, r: "TM perforation results in conductive hearing loss." },
    { section: 1, q: "Reverse slope audiogram (low-frequency loss) may indicate:", c: ["Meniere's disease", "Noise exposure", "Presbycusis", "Otosclerosis"], a: 0, r: "Greater low-frequency loss is rare and may suggest Meniere's." },
    { section: 1, q: "Retrocochlear pathology may present with:", c: ["Poor WRS relative to PTA", "Excellent speech scores", "Conductive loss", "Normal reflexes"], a: 0, r: "Retrocochlear lesions often show disproportionate speech difficulty." },
    { section: 1, q: "Cookie-bite audiometric configuration suggests:", c: ["Mid-frequency loss (often hereditary)", "High-frequency loss", "Low-frequency loss", "Flat loss"], a: 0, r: "Mid-frequency loss pattern is often genetic." },
    { section: 1, q: "Sloping audiometric configuration indicates:", c: ["Progressive high-frequency loss", "Low-frequency loss", "Flat configuration", "Mid-frequency loss"], a: 0, r: "Sloping loss is the most common pattern from aging or noise." },
    { section: 1, q: "Acoustic reflex decay suggests:", c: ["Retrocochlear disorder", "Conductive loss", "Normal function", "Presbycusis"], a: 0, r: "Reflex decay (reduction during sustained stimulus) indicates retrocochlear pathology." },
    { section: 1, q: "The malleus, incus, and stapes are:", c: ["Ossicles in middle ear", "Inner ear structures", "Outer ear components", "Nerve pathways"], a: 0, r: "The three ossicles transmit sound through the middle ear." },
    { section: 1, q: "Otoscopy should be performed:", c: ["Before all testing", "After testing", "Only if patient complains", "Annually only"], a: 0, r: "Otoscopy is essential before testing to identify contraindications." },
    { section: 1, q: "A patient reports gradual bilateral hearing loss. This suggests:", c: ["Presbycusis or noise exposure", "Acoustic neuroma", "Sudden SNHL", "Meniere's disease"], a: 0, r: "Gradual bilateral loss is typical of aging or noise-induced hearing loss." },
    { section: 1, q: "Most comfortable loudness level (MCL) helps determine:", c: ["Optimal amplification level", "Hearing threshold", "Tinnitus pitch", "WRS presentation level"], a: 0, r: "MCL guides comfortable amplification settings." },
    { section: 1, q: "Uncomfortable loudness level (UCL) establishes:", c: ["Maximum output limits", "Hearing threshold", "Speech testing level", "Masking level"], a: 0, r: "UCL determines safe maximum amplification to avoid discomfort." },
    { section: 1, q: "Conductive hearing loss is caused by:", c: ["Outer or middle ear pathology", "Inner ear damage", "Neural pathway issues", "Central processing deficit"], a: 0, r: "Conductive loss stems from problems in sound transmission through outer/middle ear." },
    { section: 1, q: "Sensorineural hearing loss results from:", c: ["Inner ear or neural damage", "Middle ear dysfunction", "Outer ear blockage", "Eustachian tube problem"], a: 0, r: "SNHL involves cochlear or auditory nerve pathology." },
    { section: 1, q: "Mixed hearing loss includes:", c: ["Both conductive and sensorineural components", "Multiple frequency involvement", "Bilateral involvement", "Fluctuating thresholds"], a: 0, r: "Mixed loss has both conductive and sensorineural elements." },
    { section: 1, q: "Presbycusis is:", c: ["Age-related hearing loss", "Noise-induced loss", "Genetic hearing loss", "Drug-induced loss"], a: 0, r: "Presbycusis is hearing loss from aging, typically high-frequency." },
    { section: 1, q: "Otosclerosis causes:", c: ["Stapes fixation leading to conductive loss", "Cochlear damage", "Neural degeneration", "TM perforation"], a: 0, r: "Otosclerosis involves abnormal bone growth fixing the stapes." },
    { section: 1, q: "Meniere's disease presents with:", c: ["Fluctuating hearing loss, tinnitus, vertigo", "Stable conductive loss", "Progressive high-frequency loss", "Normal hearing"], a: 0, r: "Meniere's classic triad: fluctuating hearing loss, tinnitus, and vertigo." },
    { section: 1, q: "Tinnitus is:", c: ["Perception of sound without external source", "Hearing loss", "Vertigo", "Ear fullness"], a: 0, r: "Tinnitus is phantom sound perception (ringing, buzzing, etc.)." },
    { section: 1, q: "Bilateral symmetrical high-frequency loss suggests:", c: ["Presbycusis or noise exposure", "Acoustic neuroma", "Otosclerosis", "Meniere's disease"], a: 0, r: "Symmetrical high-frequency loss is typical of aging or noise damage." },
    { section: 1, q: "Case history should always include:", c: ["Onset, progression, medical history", "Financial status only", "Cosmetic preferences only", "Family dynamics only"], a: 0, r: "Comprehensive case history covers onset, progression, associated symptoms, and medical background." },
    { section: 1, q: "Ototoxic medications can cause:", c: ["Sensorineural hearing loss", "Conductive hearing loss", "Middle ear infection", "Cerumen buildup"], a: 0, r: "Certain medications (aminoglycosides, chemotherapy) damage inner ear structures." },
    { section: 1, q: "A flat tympanogram with normal ear canal volume suggests:", c: ["Middle ear effusion", "Perforation", "Cerumen blockage", "Normal function"], a: 0, r: "Flat tympanogram with normal volume indicates fluid in middle ear." },
    { section: 1, q: "Cross-hearing occurs when:", c: ["Non-test ear responds to test signal", "Both ears tested simultaneously", "Patient provides inconsistent responses", "Equipment malfunctions"], a: 0, r: "Cross-hearing happens when sound crosses the skull to the non-test ear." },
    
    // Section 2 (60 questions) - Interpret and Apply Assessment Results
    { section: 2, q: "Adult mild hearing loss is:", c: ["26-40 dB HL", "21-35 dB HL", "31-45 dB HL", "15-30 dB HL"], a: 0, r: "Mild loss ranges 26-40 dB HL per ASHA standards." },
    { section: 2, q: "Sloping audiometric configuration indicates:", c: ["Progressive high-frequency loss", "Low-frequency loss", "Flat configuration", "Mid-frequency loss"], a: 0, r: "Sloping is the most common pattern from aging/noise." },
    { section: 2, q: "Asymmetrical loss >15 dB at 2 consecutive frequencies suggests:", c: ["Possible retrocochlear pathology", "Normal aging", "Cerumen", "Equipment error"], a: 0, r: "Significant asymmetry requires referral for acoustic neuroma evaluation." },
    { section: 2, q: "WRS 90-100% indicates:", c: ["Excellent discrimination", "Poor prognosis", "Retrocochlear issue", "Conductive loss"], a: 0, r: "Excellent WRS (90-100%) predicts good hearing aid benefit." },
    { section: 2, q: "WRS <60% with mild thresholds suggests:", c: ["Retrocochlear pathology", "Normal finding", "Conductive loss", "Excellent prognosis"], a: 0, r: "Disproportionately poor WRS warrants medical referral." },
    { section: 2, q: "Flat audiometric configuration suggests:", c: ["Similar loss across frequencies", "High-frequency loss", "Low-frequency loss", "Normal hearing"], a: 0, r: "Flat configuration shows consistent loss across frequencies." },
    { section: 2, q: "Cookie-bite pattern indicates:", c: ["Mid-frequency loss (often hereditary)", "High-frequency loss", "Low-frequency loss", "Noise-induced"], a: 0, r: "Mid-frequency loss is often genetic." },
    { section: 2, q: "Notched audiogram at 4000 Hz suggests:", c: ["Noise-induced hearing loss", "Presbycusis", "Meniere's", "Otosclerosis"], a: 0, r: "4000 Hz notch is classic for noise exposure." },
    { section: 2, q: "Reverse slope (greater low-frequency loss) may indicate:", c: ["Meniere's disease", "Presbycusis", "Noise exposure", "Otosclerosis"], a: 0, r: "Low-frequency loss is rare and may suggest Meniere's." },
    { section: 2, q: "HIPAA requires:", c: ["Patient authorization for record disclosure", "Public record sharing", "Verbal consent only", "No documentation"], a: 0, r: "HIPAA mandates written authorization for protected health information disclosure." },
    { section: 2, q: "Documentation must include:", c: ["Complete audiometric data and findings", "Financial information only", "Abbreviated notes", "Subjective impressions only"], a: 0, r: "Comprehensive documentation includes all test results, findings, and recommendations." },
    { section: 2, q: "Patient counseling should:", c: ["Use plain language, avoid jargon", "Use technical terminology", "Focus only on device features", "Be brief without explanation"], a: 0, r: "Effective counseling uses clear, understandable language." },
    { section: 2, q: "Realistic expectations include explaining:", c: ["Hearing aids improve but don't restore normal hearing", "Hearing aids cure hearing loss", "No adjustment period needed", "Perfect hearing in all situations"], a: 0, r: "Setting realistic expectations is crucial for patient satisfaction." },
    { section: 2, q: "When presenting findings, you should:", c: ["Show audiogram and explain implications", "Give test results only", "Avoid discussing findings", "Refer immediately without explanation"], a: 0, r: "Visual aids and clear explanation enhance patient understanding." },
    { section: 2, q: "Medical referral is indicated for:", c: ["Sudden hearing loss >30 dB", "Stable mild loss", "Cerumen visible", "Bilateral presbycusis"], a: 0, r: "Sudden SNHL requires immediate medical attention." },
    { section: 2, q: "Conductive hearing loss requires:", c: ["Medical evaluation before amplification", "Immediate hearing aid fitting", "No further action", "Annual monitoring only"], a: 0, r: "Conductive loss needs medical clearance before proceeding with amplification." },
    { section: 2, q: "Poor WRS relative to thresholds indicates:", c: ["Possible retrocochlear pathology", "Normal finding", "Good prognosis", "Equipment malfunction"], a: 0, r: "Disproportionate speech difficulty suggests neural involvement." },
    { section: 2, q: "Informed consent requires:", c: ["Explanation of procedures, risks, alternatives", "Brief verbal statement", "Signature only", "Family approval only"], a: 0, r: "Informed consent involves comprehensive explanation and documentation." },
    { section: 2, q: "Patient education should include:", c: ["Hearing loss type, implications, treatment options", "Device cost only", "Brief product overview", "No explanation needed"], a: 0, r: "Thorough education covers diagnosis, prognosis, and all options." },
    { section: 2, q: "Communication partners should be taught:", c: ["Face-to-face communication, reduce noise", "Shout at patient", "Speak from another room", "Avoid looking at patient"], a: 0, r: "Family education improves communication success." },
    { section: 2, q: "Moderate hearing loss ranges:", c: ["41-55 dB HL", "31-45 dB HL", "46-60 dB HL", "35-50 dB HL"], a: 0, r: "Moderate loss is defined as 41-55 dB HL." },
    { section: 2, q: "Severe hearing loss is:", c: ["71-90 dB HL", "61-80 dB HL", "76-95 dB HL", "65-85 dB HL"], a: 0, r: "Severe loss ranges from 71-90 dB HL." },
    { section: 2, q: "Profound hearing loss exceeds:", c: ["90 dB HL", "80 dB HL", "100 dB HL", "85 dB HL"], a: 0, r: "Profound loss is >90 dB HL." },
    { section: 2, q: "Moderately severe hearing loss is:", c: ["56-70 dB HL", "51-65 dB HL", "61-75 dB HL", "46-60 dB HL"], a: 0, r: "Moderately severe ranges 56-70 dB HL." },
    { section: 2, q: "Air-bone gap ≥15 dB indicates:", c: ["Conductive component", "Sensorineural loss", "Normal variation", "Testing error"], a: 0, r: "Significant gap suggests conductive pathology." },
    { section: 2, q: "Type A tympanogram suggests:", c: ["Normal middle ear function", "Fluid", "Perforation", "Eustachian dysfunction"], a: 0, r: "Type A indicates normal middle ear status." },
    { section: 2, q: "Type B tympanogram indicates:", c: ["Flat - possible fluid or perforation", "Normal function", "Negative pressure", "Stiff system"], a: 0, r: "Type B shows no peak, suggesting middle ear pathology." },
    { section: 2, q: "Type C tympanogram shows:", c: ["Negative pressure from Eustachian dysfunction", "Normal function", "Fluid", "Perforation"], a: 0, r: "Type C indicates negative middle ear pressure." },
    { section: 2, q: "SRT and PTA should agree within:", c: ["±6 dB", "±10 dB", "±15 dB", "±3 dB"], a: 0, r: "Agreement within ±6 dB validates test reliability." },
    { section: 2, q: "WRS 75-89% indicates:", c: ["Good discrimination ability", "Poor discrimination", "Retrocochlear issue", "Conductive loss"], a: 0, r: "Good WRS predicts successful hearing aid use." },
    { section: 2, q: "WRS 60-74% suggests:", c: ["Fair discrimination - may need advanced features", "Excellent prognosis", "Poor candidacy", "Retrocochlear pathology"], a: 0, r: "Fair WRS may require assistive technology and rehabilitation." },
    { section: 2, q: "Unilateral tinnitus with hearing loss requires:", c: ["Medical referral", "Immediate fitting", "Observation", "Annual follow-up"], a: 0, r: "Unilateral tinnitus is a red flag for acoustic neuroma." },
    { section: 2, q: "Otalgia (ear pain) is:", c: ["Contraindication requiring referral", "Normal with hearing loss", "Ignore and proceed", "Temporary condition"], a: 0, r: "Ear pain requires medical evaluation before amplification." },
    { section: 2, q: "Ear drainage indicates:", c: ["Active infection - medical referral needed", "Normal finding", "Cerumen", "Proceed with fitting"], a: 0, r: "Otorrhea requires medical clearance." },
    { section: 2, q: "Vertigo or dizziness suggests:", c: ["Vestibular pathology - refer medically", "Normal aging", "Proceed with fitting", "Psychological issue"], a: 0, r: "Vestibular symptoms require medical evaluation." },
    { section: 2, q: "Sudden unilateral hearing loss is:", c: ["Medical emergency", "Normal aging", "Cerumen impaction", "Noise exposure"], a: 0, r: "Sudden SNHL requires immediate medical intervention." },
    { section: 2, q: "Progressive bilateral symmetric hearing loss suggests:", c: ["Presbycusis or noise exposure", "Acoustic neuroma", "Sudden SNHL", "Meniere's disease"], a: 0, r: "Gradual bilateral loss is typical of aging or noise damage." },
    { section: 2, q: "Acoustic reflex absent with normal compliance suggests:", c: ["Retrocochlear pathology", "Normal finding", "Conductive loss", "Equipment error"], a: 0, r: "Absent reflexes with normal tymp may indicate neural involvement." },
    { section: 2, q: "Patient refuses medical referral for red flag. You should:", c: ["Document refusal, don't proceed with fitting", "Fit hearing aids anyway", "Call physician directly", "Ignore red flag"], a: 0, r: "Document patient refusal but do not proceed without medical clearance." },
    { section: 2, q: "Presbycusis typically presents as:", c: ["Bilateral high-frequency loss", "Unilateral loss", "Low-frequency loss", "Mid-frequency loss"], a: 0, r: "Age-related hearing loss affects high frequencies bilaterally." },
    { section: 2, q: "Noise-induced hearing loss shows:", c: ["Bilateral notch at 3000-6000 Hz", "Low-frequency loss", "Unilateral loss", "Flat configuration"], a: 0, r: "NIHL creates characteristic high-frequency notch bilaterally." },
    { section: 2, q: "Otosclerosis typically causes:", c: ["Conductive loss with normal otoscopy", "Sensorineural loss", "Mixed loss initially", "No hearing loss"], a: 0, r: "Otosclerosis presents with conductive loss and normal-appearing TM." },
    { section: 2, q: "Meniere's disease involves:", c: ["Fluctuating low-frequency hearing loss", "Stable high-frequency loss", "Conductive loss", "Bilateral symmetric loss"], a: 0, r: "Meniere's typically affects low frequencies with fluctuation." },
    { section: 2, q: "Acoustic neuroma typically presents with:", c: ["Unilateral or asymmetric loss", "Bilateral symmetric loss", "Conductive loss", "Normal hearing"], a: 0, r: "Acoustic neuromas cause asymmetric or unilateral SNHL." },
    { section: 2, q: "Case history red flags include:", c: ["Sudden loss, asymmetry, pain, drainage", "Gradual bilateral loss", "Mild difficulty in noise", "Family history"], a: 0, r: "Sudden onset, asymmetry, and pain/drainage require medical referral." },
    { section: 2, q: "HIPAA Privacy Rule protects:", c: ["Patient health information", "Financial records", "Business practices", "Manufacturer data"], a: 0, r: "HIPAA safeguards protected health information." },
    { section: 2, q: "Patient has right to:", c: ["Access their medical records", "Demand specific treatment", "Violate office policies", "Share others' information"], a: 0, r: "Patients have legal right to access their health records." },
    { section: 2, q: "Minimum necessary standard means:", c: ["Use/disclose only information needed", "Share all patient information", "Provide minimal treatment", "Reduce documentation"], a: 0, r: "HIPAA requires disclosing only information necessary for purpose." },
    { section: 2, q: "When discussing findings with patient, you should:", c: ["Ensure privacy and confidentiality", "Discuss in waiting room", "Use speakerphone", "Share with family without consent"], a: 0, r: "Patient confidentiality must be maintained during all discussions." },
    { section: 2, q: "Tinnitus severity can be assessed using:", c: ["Tinnitus Handicap Inventory (THI)", "Audiogram only", "Visual inspection", "Blood pressure"], a: 0, r: "THI and similar questionnaires quantify tinnitus impact." },
    { section: 2, q: "High-frequency hearing loss typically causes difficulty with:", c: ["Consonant sounds (s, sh, f, th)", "Vowel sounds", "Low-pitch voices", "Environmental sounds"], a: 0, r: "High frequencies carry consonant information critical for clarity." },
    { section: 2, q: "Low-frequency hearing loss affects:", c: ["Vowels and background noise perception", "Consonants", "Speech clarity", "High-pitch sounds"], a: 0, r: "Low frequencies carry vowel information and contribute to noise perception." },
    { section: 2, q: "Communication strategies should be discussed:", c: ["During counseling with patient and family", "Only if patient asks", "After fitting only", "Not necessary"], a: 0, r: "Proactive communication strategies improve outcomes." },
    { section: 2, q: "Informed decision-making requires:", c: ["Patient understanding risks, benefits, alternatives", "Provider decision only", "Cost information only", "Brief explanation"], a: 0, r: "True informed consent requires comprehensive understanding." },
    { section: 2, q: "Documentation should be:", c: ["Legible, complete, dated, and signed", "Brief notes only", "Verbal only", "Optional"], a: 0, r: "Proper documentation is legal and ethical requirement." },
    { section: 2, q: "Otoscopic findings should include:", c: ["TM appearance, canal condition, cerumen", "Subjective impression only", "Brief mention", "Not necessary"], a: 0, r: "Detailed otoscopic findings document contraindications and baseline." },
    { section: 2, q: "When test results are inconsistent, you should:", c: ["Retest and investigate causes", "Proceed anyway", "Estimate results", "Refer immediately"], a: 0, r: "Inconsistent results require investigation to ensure validity." },
    { section: 2, q: "Patient counseling effectiveness is enhanced by:", c: ["Written materials and visual aids", "Verbal explanation only", "Technical jargon", "Rushed discussion"], a: 0, r: "Multi-modal education improves comprehension and retention." },
    
    // Section 3 (60 questions) - Select Hearing Devices  
    { section: 3, q: "RIC (Receiver-in-Canal) advantage over CIC is:", c: ["Greater feature set and serviceability", "Always better cosmetics", "Never needs maintenance", "Guaranteed better WRS"], a: 0, r: "RICs offer more features, power options, and easier service than deep customs." },
    { section: 3, q: "BTE devices are best for:", c: ["Severe/profound loss and poor dexterity", "Mild loss only", "Cosmetic concerns", "Active moisture exposure"], a: 0, r: "BTEs provide maximum power and easier handling." },
    { section: 3, q: "CIC/IIC devices require:", c: ["Good dexterity and mild-moderate loss", "Severe loss", "Poor manual skills", "Deep ear canals"], a: 0, r: "Deep customs need good dexterity for insertion/removal." },
    { section: 3, q: "ITE (In-the-Ear) devices are suitable for:", c: ["Moderate-severe loss with easier handling", "Mild loss only", "Profound loss", "Very small canals"], a: 0, r: "ITEs balance power, features, and handling ease." },
    { section: 3, q: "Open-fit hearing aids are best for:", c: ["High-frequency loss with good low-frequencies", "Flat hearing loss", "Severe loss", "Low-frequency loss"], a: 0, r: "Open fits minimize occlusion for high-frequency loss patterns." },
    { section: 3, q: "Directional microphones improve:", c: ["Speech understanding in noise", "Hearing in quiet", "Music quality", "Own voice quality"], a: 0, r: "Directional mics focus on front sounds, reducing background noise." },
    { section: 3, q: "Feedback management systems:", c: ["Reduce whistling through phase cancellation", "Increase gain", "Improve sound quality", "Save battery"], a: 0, r: "Advanced feedback cancellation allows more gain without whistling." },
    { section: 3, q: "Frequency lowering technology is used for:", c: ["Severe high-frequency loss with dead regions", "Low-frequency loss", "Mild loss", "Normal hearing"], a: 0, r: "Frequency lowering moves high-frequency sounds to audible regions." },
    { section: 3, q: "Telecoil (T-coil) is used for:", c: ["Loop systems and landline phones", "Bluetooth streaming", "Battery saving", "Feedback reduction"], a: 0, r: "T-coils pick up electromagnetic signals from loop systems and phones." },
    { section: 3, q: "Rechargeable hearing aids are best for:", c: ["Poor dexterity and environmental benefit", "Cost savings", "Maximum power", "Extended warranty"], a: 0, r: "Rechargeable batteries eliminate manual battery changes." },
    { section: 3, q: "Disposable (zinc-air) battery sizes from smallest to largest:", c: ["10, 312, 13, 675", "675, 13, 312, 10", "312, 10, 13, 675", "13, 312, 675, 10"], a: 0, r: "Battery size increases with device size: 10 (smallest) to 675 (largest)." },
    { section: 3, q: "Size 10 batteries are typically used in:", c: ["CIC and small devices", "BTE devices", "Power hearing aids", "ITE devices"], a: 0, r: "Size 10 batteries fit the smallest hearing aids." },
    { section: 3, q: "Size 675 batteries are used for:", c: ["Power BTE devices", "CIC devices", "RIC devices", "ITC devices"], a: 0, r: "Size 675 provides power for severe/profound loss." },
    { section: 3, q: "Bluetooth connectivity allows:", c: ["Wireless streaming from phones/TV", "Better sound quality", "Longer battery life", "Reduced feedback"], a: 0, r: "Bluetooth enables direct audio streaming from devices." },
    { section: 3, q: "Noise reduction algorithms:", c: ["Reduce steady-state background noise", "Eliminate all noise", "Improve speech in all situations", "Replace directional mics"], a: 0, r: "Noise reduction identifies and suppresses steady background noise." },
    { section: 3, q: "Automatic environmental adaptation:", c: ["Adjusts settings based on sound environment", "Requires manual changes", "Only works in quiet", "Reduces battery life"], a: 0, r: "Automatic programs detect environment and optimize settings." },
    { section: 3, q: "Multiple listening programs allow:", c: ["Different settings for various situations", "Multiple users", "Bilateral streaming", "Extended warranty"], a: 0, r: "Programs optimize hearing aids for specific environments." },
    { section: 3, q: "Severe hearing loss requires:", c: ["High-power receiver or BTE", "CIC device", "Open fit", "Standard RIC"], a: 0, r: "Severe loss needs devices with sufficient gain and output." },
    { section: 3, q: "Mild hearing loss can use:", c: ["Any style if dexterity allows", "BTE only", "Power devices only", "No amplification"], a: 0, r: "Mild loss has flexibility in device selection." },
    { section: 3, q: "Patient with arthritis should consider:", c: ["Larger device with rechargeable battery", "CIC with size 10 battery", "Complex multi-button device", "Custom IIC"], a: 0, r: "Poor dexterity requires easier-to-handle devices." },
    { section: 3, q: "Very small/narrow ear canals suggest:", c: ["BTE or RIC preferred over custom", "CIC ideal", "IIC only option", "No hearing aids possible"], a: 0, r: "Small canals may not accommodate custom devices." },
    { section: 3, q: "Heavy cerumen production suggests:", c: ["BTE/RIC with receiver out of canal", "Deep CIC device", "No amplification", "Custom ITE"], a: 0, r: "Keeping receiver out of canal reduces cerumen-related issues." },
    { section: 3, q: "Active lifestyle with varied environments benefits from:", c: ["Higher technology level with automatic features", "Basic technology", "Single program only", "Manual adjustments"], a: 0, r: "Active users benefit from sophisticated automatic adaptation." },
    { section: 3, q: "Cosmetically motivated patient may prefer:", c: ["RIC, ITC, or CIC if audiometrically appropriate", "BTE only", "Body-worn aid", "Bright colors"], a: 0, r: "Smaller/discrete devices appeal to cosmetic concerns." },
    { section: 3, q: "Full shell earmold provides:", c: ["Maximum coupling and feedback prevention", "Natural sound", "Minimal occlusion", "Best for mild loss"], a: 0, r: "Full shell offers maximum seal for severe loss." },
    { section: 3, q: "Open-fit earmold is ideal for:", c: ["High-frequency loss with good low frequencies", "Severe flat loss", "Low-frequency loss", "Profound loss"], a: 0, r: "Open fits prevent occlusion effect when low frequencies are normal." },
    { section: 3, q: "Skeleton earmold offers:", c: ["Less material, better comfort, moderate loss", "Maximum gain", "Best for severe loss", "Invisible option"], a: 0, r: "Skeleton molds balance retention and comfort." },
    { section: 3, q: "Venting in earmolds:", c: ["Reduces occlusion but decreases low-frequency gain", "Increases gain", "Prevents all feedback", "Required for all fittings"], a: 0, r: "More vent = less occlusion but also less low-frequency amplification." },
    { section: 3, q: "No vent (closed) earmold is used for:", c: ["Severe loss to maximize gain and prevent feedback", "Mild loss", "Normal low frequencies", "Cosmetic appeal"], a: 0, r: "Closed fittings prevent feedback for high-gain needs." },
    { section: 3, q: "Large vent (3mm+) reduces:", c: ["Occlusion effect significantly", "High-frequency gain", "All sound", "Battery life"], a: 0, r: "Large vents alleviate hollow/boomy own-voice sensation." },
    { section: 3, q: "Occlusion effect is:", c: ["Hollow sensation of own voice with blocked canal", "Feedback whistle", "Environmental noise", "Hearing aid malfunction"], a: 0, r: "Occlusion occurs when canal is blocked and low frequencies are normal." },
    { section: 3, q: "Basic technology level includes:", c: ["Simple amplification, limited channels", "Advanced noise reduction", "Directional microphones", "Wireless streaming"], a: 0, r: "Basic devices offer essential amplification with fewer features." },
    { section: 3, q: "Premium technology level offers:", c: ["Advanced features, wireless connectivity, sophisticated processing", "Lower cost", "Simpler programming", "Fewer channels"], a: 0, r: "Premium devices have maximum features for complex environments." },
    { section: 3, q: "Mid-level technology provides:", c: ["Directional mics, moderate noise reduction, good for varied environments", "Maximum features", "Minimal processing", "No environmental adaptation"], a: 0, r: "Mid-level balances features and cost for typical users." },
    { section: 3, q: "Compression in hearing aids:", c: ["Adjusts gain based on input level", "Compresses device size", "Reduces battery consumption", "Eliminates noise"], a: 0, r: "Compression provides more gain for soft sounds, less for loud sounds." },
    { section: 3, q: "Wide dynamic range compression (WDRC):", c: ["Makes soft sounds audible, loud sounds comfortable", "Limits maximum output only", "Linear amplification", "Reduces all sounds equally"], a: 0, r: "WDRC is the most common compression strategy in modern hearing aids." },
    { section: 3, q: "Number of channels affects:", c: ["Precision of frequency-specific adjustments", "Device size", "Battery life", "Feedback"], a: 0, r: "More channels allow finer frequency shaping to match hearing loss." },
    { section: 3, q: "CROS (Contralateral Routing of Signal) is for:", c: ["Unilateral hearing loss with good opposite ear", "Bilateral loss", "Single-sided mild loss", "Bilateral profound loss"], a: 0, r: "CROS routes sound from deaf ear to hearing ear." },
    { section: 3, q: "BiCROS is used when:", c: ["One ear is deaf, other has hearing loss", "Both ears have normal hearing", "Both ears have mild loss", "One ear has mild loss"], a: 0, r: "BiCROS amplifies for hearing-impaired ear while routing from deaf ear." },
    { section: 3, q: "Bone conduction hearing aids are appropriate for:", c: ["Conductive loss or atresia with good cochlear function", "Sensorineural loss", "Mild hearing loss", "Presbycusis"], a: 0, r: "Bone conduction devices bypass outer/middle ear for conductive issues." },
    { section: 3, q: "Implantable bone conduction devices require:", c: ["Surgical placement of osseointegrated fixture", "No surgery", "Daily removal", "External components only"], a: 0, r: "Implantable bone devices require surgical implantation." },
    { section: 3, q: "Cochlear implants are considered when:", c: ["Severe-profound loss with poor hearing aid benefit", "Mild hearing loss", "Good hearing aid performance", "Conductive loss"], a: 0, r: "Cochlear implants are for profound loss not helped by hearing aids." },
    { section: 3, q: "Custom hearing aids require:", c: ["Ear impressions", "No impressions", "Stock shells only", "Universal fit"], a: 0, r: "Custom devices are made from individual ear impressions." },
    { section: 3, q: "Ear impression should extend to:", c: ["Beyond second bend of canal", "First bend only", "Aperture only", "Tragus"], a: 0, r: "Deep seal ensures proper fit and retention." },
    { section: 3, q: "Otoblock placement is:", c: ["Beyond second bend, 3-5mm past", "At aperture", "At first bend", "At eardrum"], a: 0, r: "Otoblock protects TM while allowing adequate impression depth." },
    { section: 3, q: "Before taking ear impression:", c: ["Perform otoscopy to check for contraindications", "Take impression immediately", "No examination needed", "Ask patient only"], a: 0, r: "Otoscopy ensures TM integrity and no contraindications." },
    { section: 3, q: "Ear impression contraindications include:", c: ["TM perforation, active infection, drainage", "Cerumen present", "Small canal", "Previous impressions"], a: 0, r: "Never take impressions with TM perforation or active pathology." },
    { section: 3, q: "Patient with cognitive impairment should have:", c: ["Automatic features, simple controls, rechargeable", "Complex multi-program device", "Manual volume only", "Many buttons"], a: 0, r: "Simplified operation aids users with memory/cognitive issues." },
    { section: 3, q: "Flat hearing loss configuration suggests:", c: ["Closed fitting or adequate low-frequency amplification", "Open fit", "Large vent", "Minimal amplification"], a: 0, r: "Flat loss needs amplification across all frequencies." },
    { section: 3, q: "Sloping high-frequency loss suggests:", c: ["Open fit or vented to reduce occlusion", "Closed fitting", "No venting", "Maximum low-frequency gain"], a: 0, r: "Preserve natural low frequencies to minimize occlusion effect." },
    { section: 3, q: "Speech-in-noise difficulty suggests need for:", c: ["Directional microphones and noise reduction", "Omnidirectional only", "Basic amplification", "No special features"], a: 0, r: "Noise complaints require advanced directional and noise reduction features." },
    { section: 3, q: "Moisture exposure (sports, humidity) suggests:", c: ["Water-resistant coating and proper maintenance", "No hearing aids", "Daily professional cleaning", "Avoid all moisture"], a: 0, r: "Water-resistant devices and dry-aid kits manage moisture." },
    { section: 3, q: "Binaural amplification (two hearing aids) is preferred because:", c: ["Improves localization, speech in noise, and balance", "Saves money", "Easier fitting", "Required by law"], a: 0, r: "Bilateral fitting provides superior outcomes for bilateral loss." },
    { section: 3, q: "Monaural fitting may be acceptable when:", c: ["Unilateral loss or patient choice/budget", "Always preferred", "Bilateral mild loss", "Better outcomes"], a: 0, r: "Monaural is less ideal but acceptable in specific circumstances." },
    { section: 3, q: "RIC devices use:", c: ["Thin wire to receiver in ear canal", "Traditional tubing", "No connection", "Bone conduction"], a: 0, r: "RIC design places receiver in canal with thin wire connection." },
    { section: 3, q: "Traditional BTE uses:", c: ["Earhook and tubing to earmold", "Thin wire", "Direct insertion", "No tubing"], a: 0, r: "BTE sound travels through earhook and tubing to earmold." },
    { section: 3, q: "Slim-tube open fit uses:", c: ["Thin tube to small dome, minimal occlusion", "Traditional thick tubing", "Custom earmold", "Closed seal"], a: 0, r: "Slim tubes provide cosmetic appeal and comfort with minimal occlusion." },
    { section: 3, q: "Dome options include:", c: ["Open, closed, power - varying seal levels", "Custom only", "One size fits all", "No options available"], a: 0, r: "Dome selection balances occlusion, retention, and acoustic needs." },
    { section: 3, q: "Volume control may be:", c: ["Manual button, automatic, or app-controlled", "Always manual", "Never available", "Professional only"], a: 0, r: "Volume adjustment options range from manual to fully automatic." },
    { section: 3, q: "Program button allows:", c: ["User to switch between listening programs", "Turn device on/off only", "Adjust volume", "Check battery"], a: 0, r: "Program buttons let users select situation-specific settings." },

    // Section 4 (60 questions) - Fit and Dispense Hearing Devices
    { section: 4, q: "NAL-NL2 prescriptive formula emphasizes:", c: ["Balanced intelligibility and comfort", "Maximum audibility", "Flat gain", "MPO only"], a: 0, r: "NAL-NL2 optimizes speech intelligibility while maintaining comfort." },
    { section: 4, q: "DSL v5 formula emphasizes:", c: ["Maximum audibility approach", "Comfort over audibility", "Minimal gain", "Flat response"], a: 0, r: "DSL v5 prescribes more aggressive gain for maximum audibility." },
    { section: 4, q: "DSL v5 is typically used for:", c: ["Children", "Adults only", "Mild loss only", "Unilateral loss"], a: 0, r: "DSL's audibility focus makes it ideal for pediatric fittings." },
    { section: 4, q: "NAL-NL2 is commonly used for:", c: ["Adults", "Children only", "Profound loss only", "Conductive loss"], a: 0, r: "NAL-NL2 is the most common adult prescription formula." },
    { section: 4, q: "Real ear measurement (REM) is:", c: ["Gold standard for verification", "Optional step", "Not necessary", "Same as manufacturer first-fit"], a: 0, r: "REM is essential for validating prescriptive targets in individual ears." },
    { section: 4, q: "REUR (Real Ear Unaided Response) measures:", c: ["Natural ear canal resonance without hearing aid", "Aided response", "Hearing threshold", "Insertion gain"], a: 0, r: "REUR shows natural ear canal acoustics, typically peak around 2700 Hz." },
    { section: 4, q: "REAR (Real Ear Aided Response) measures:", c: ["SPL in ear canal with hearing aid on", "Unaided response", "Insertion gain", "Threshold"], a: 0, r: "REAR measures actual output with hearing aid functioning." },
    { section: 4, q: "REIG (Real Ear Insertion Gain) is:", c: ["REAR minus REUR (actual gain provided)", "REUR minus REAR", "Threshold measurement", "Unaided response"], a: 0, r: "REIG represents the actual gain added by the hearing aid." },
    { section: 4, q: "REM target matching goal is within:", c: ["±5 dB of prescriptive target", "±10 dB", "±15 dB", "±2 dB"], a: 0, r: "Gain within ±5 dB of target is considered acceptable match." },
    { section: 4, q: "REM should verify gain at:", c: ["Soft (50), average (65), loud (80) input levels", "65 dB only", "80 dB only", "One level sufficient"], a: 0, r: "Multiple input levels verify proper compression across range." },
    { section: 4, q: "REM accounts for:", c: ["Individual ear canal acoustics", "Manufacturer specs only", "Average ear data", "Patient preference only"], a: 0, r: "REM measures actual acoustics in patient's unique ear." },
    { section: 4, q: "Aided audiometry measures:", c: ["Functional hearing improvement with devices", "Unaided thresholds", "Real ear gain", "Speech scores only"], a: 0, r: "Aided testing demonstrates improvement in threshold sensitivity." },
    { section: 4, q: "First step in programming is:", c: ["Input audiometric data", "Select device style", "Take ear impression", "Verify with REM"], a: 0, r: "Accurate audiometric data entry is foundation of fitting." },
    { section: 4, q: "Manufacturer first-fit is:", c: ["Initial estimate requiring verification", "Final fitting", "Gold standard", "Replaces REM"], a: 0, r: "First-fit is starting point but needs verification and adjustment." },
    { section: 4, q: "Hearing aid insertion for adult requires:", c: ["Pull auricle back and up", "Pull auricle forward", "Pull auricle down", "No manipulation needed"], a: 0, r: "Pulling back and up straightens adult ear canal for insertion." },
    { section: 4, q: "Proper custom device insertion involves:", c: ["Angling posteriorly, then rotating anteriorly", "Straight insertion", "Pushing hard", "Rotating only"], a: 0, r: "Following canal anatomy ensures comfortable, secure fit." },
    { section: 4, q: "Physical fit should be checked for:", c: ["Security, comfort, no feedback, no occlusion", "Appearance only", "Color match", "Size only"], a: 0, r: "Comprehensive fit check ensures functional and comfortable device." },
    { section: 4, q: "Feedback (whistling) may indicate:", c: ["Poor seal or excessive gain", "Perfect fit", "Dead battery", "Normal function"], a: 0, r: "Feedback occurs when amplified sound re-enters microphone." },
    { section: 4, q: "Loose hearing aid suggests:", c: ["Improper insertion or wrong size", "Perfect fit", "Maximum gain", "Adequate seal"], a: 0, r: "Loose devices compromise performance and retention." },
    { section: 4, q: "Patient complains own voice sounds hollow. Adjust by:", c: ["Increasing vent or reducing low-frequency gain", "Reducing high frequencies", "Adding gain", "Closing vent"], a: 0, r: "Occlusion effect is reduced with more venting or less low-frequency gain." },
    { section: 4, q: "Patient reports sounds too loud overall. Adjust by:", c: ["Reducing overall gain", "Increasing gain", "Changing style", "Adding vent"], a: 0, r: "Excessive loudness requires gain reduction." },
    { section: 4, q: "Patient reports background noise too loud. Adjust by:", c: ["Reduce low frequencies, increase noise reduction", "Increase all frequencies", "Turn off device", "Maximum gain"], a: 0, r: "Low-frequency reduction and noise features help background noise complaints." },
    { section: 4, q: "Patient reports speech not clear. Adjust by:", c: ["Increase mid-to-high frequency gain", "Reduce high frequencies", "Reduce all gain", "Add low frequencies"], a: 0, r: "Clarity comes from adequate mid and high-frequency amplification." },
    { section: 4, q: "Patient orientation must include:", c: ["Insertion/removal, battery, care, expectations", "Cost only", "Warranty only", "Brief overview"], a: 0, r: "Comprehensive orientation ensures patient success." },
    { section: 4, q: "Patient should practice insertion/removal:", c: ["3-5 times during appointment", "Once is sufficient", "At home only", "Not necessary"], a: 0, r: "Hands-on practice builds confidence and competence." },
    { section: 4, q: "Battery management education includes:", c: ["Removal of tab, 1-minute wait, proper disposal", "Immediate insertion", "No special instructions", "Store in freezer"], a: 0, r: "Proper battery handling ensures optimal performance and safety." },
    { section: 4, q: "Daily care instructions include:", c: ["Wipe clean, remove cerumen, open battery door at night", "No cleaning needed", "Weekly cleaning only", "Annual service only"], a: 0, r: "Daily maintenance prevents problems and extends device life." },
    { section: 4, q: "Realistic expectations include explaining:", c: ["Hearing aids improve but don't restore normal hearing", "Perfect hearing immediately", "No adjustment period", "Cures hearing loss"], a: 0, r: "Setting realistic expectations is crucial for satisfaction." },
    { section: 4, q: "Acclimation period is typically:", c: ["2-4 weeks for adjustment", "1 day", "No adjustment needed", "6 months"], a: 0, r: "Brain needs time to relearn how to process amplified sounds." },
    { section: 4, q: "Recommended daily wear time during adjustment:", c: ["8+ hours daily for best adaptation", "1 hour daily", "Only when needed", "24 hours"], a: 0, r: "Consistent wear accelerates acclimation." },
    { section: 4, q: "First follow-up appointment should be:", c: ["1-2 weeks after fitting", "1 day", "3 months", "1 year"], a: 0, r: "Early follow-up allows timely adjustments and reinforcement." },
    { section: 4, q: "Maximum output (MPO) is adjusted to:", c: ["Prevent discomfort from loud sounds", "Increase gain", "Improve speech", "Reduce battery drain"], a: 0, r: "MPO set at or below UCL prevents overly loud sounds." },
    { section: 4, q: "Compression ratio determines:", c: ["How much gain reduction occurs with louder inputs", "Device size", "Battery life", "Feedback"], a: 0, r: "Compression ratio defines relationship between input and output changes." },
    { section: 4, q: "Compression threshold (TK) is:", c: ["Input level where compression begins", "Maximum output", "Feedback threshold", "Battery warning"], a: 0, r: "TK determines when compression activates." },
    { section: 4, q: "Attack time in compression refers to:", c: ["How quickly compression responds to input changes", "Programming speed", "Battery life", "Insertion time"], a: 0, r: "Fast attack time quickly reduces gain for sudden loud sounds." },
    { section: 4, q: "Release time in compression refers to:", c: ["How quickly gain returns after loud sound ends", "Battery removal", "Device removal", "Warranty period"], a: 0, r: "Release time affects how compression releases after input decreases." },
    { section: 4, q: "Frequency shaping refers to:", c: ["Adjusting gain differently across frequencies", "Device shape", "Earmold design", "Microphone direction"], a: 0, r: "Frequency shaping matches amplification to hearing loss configuration." },
    { section: 4, q: "Gain is:", c: ["Amount of amplification provided (dB)", "Device weight", "Battery size", "Canal depth"], a: 0, r: "Gain is the difference between input and output levels." },
    { section: 4, q: "Output limiting prevents:", c: ["Excessive loud sounds reaching ear", "Soft sound amplification", "Feedback", "Battery drain"], a: 0, r: "Output limiting protects from harmful sound levels." },
    { section: 4, q: "Linear amplification provides:", c: ["Same gain regardless of input level", "Varying gain", "Compression", "Frequency shaping"], a: 0, r: "Linear amplification is rarely used in modern devices." },
    { section: 4, q: "Expansion is used to:", c: ["Reduce very soft sounds (noise floor)", "Increase maximum output", "Improve loud sounds", "Adjust compression"], a: 0, r: "Expansion reduces amplification of very soft environmental noise." },
    { section: 4, q: "Impulse noise reduction:", c: ["Quickly limits sudden loud transient sounds", "Reduces steady noise", "Eliminates all noise", "Improves speech"], a: 0, r: "Impulse reduction protects from sharp sounds like door slams." },
    { section: 4, q: "Wind noise management:", c: ["Detects and reduces wind buffeting noise", "Eliminates all wind sound", "Improves wind hearing", "Not possible"], a: 0, r: "Algorithms identify and suppress wind noise patterns." },
    { section: 4, q: "When patient cannot achieve target gain due to feedback:", c: ["Maximize feedback management, reduce gain, consider remake", "Force full gain", "Ignore feedback", "Use basic device"], a: 0, r: "Balance target gain with feedback management and physical fit." },
    { section: 4, q: "Demonstration of device function before fitting confirms:", c: ["Device works properly before delivery", "Patient satisfaction", "Prescription accuracy", "Insurance approval"], a: 0, r: "Pre-fitting function check prevents delivering faulty devices." },
    { section: 4, q: "Listening check (stetoclip) allows professional to:", c: ["Hear device output for quality assessment", "Measure gain", "Program device", "Clean device"], a: 0, r: "Listening check identifies distortion, noise, or intermittency." },
    { section: 4, q: "Visual inspection before fitting checks for:", c: ["Physical damage, debris, proper assembly", "Color", "Brand", "Age"], a: 0, r: "Visual inspection catches obvious defects before delivery." },
    { section: 4, q: "Patient reports intermittent sound. Likely causes:", c: ["Loose battery contact, corrosion, moisture", "Perfect function", "Patient error only", "Normal behavior"], a: 0, r: "Intermittency often results from connection or moisture issues." },
    { section: 4, q: "Patient reports distorted sound. Check:", c: ["Cerumen blockage, moisture, damaged receiver", "Battery only", "Volume setting", "Patient hearing"], a: 0, r: "Distortion often indicates physical obstruction or component damage." },
    { section: 4, q: "Whistling only when chewing/talking suggests:", c: ["Jaw movement causing poor seal", "Dead battery", "Broken device", "Normal function"], a: 0, r: "Jaw motion can temporarily disrupt seal causing feedback." },
    { section: 4, q: "No sound from device. First check:", c: ["Battery polarity, charge, on/off status", "Order new device", "Refer to ENT", "Check programming"], a: 0, r: "Battery and power are first troubleshooting steps for dead device." },
    { section: 4, q: "Weak/fading sound suggests:", c: ["Dying battery or partial blockage", "Perfect function", "Maximum gain reached", "Normal aging"], a: 0, r: "Weak sound often indicates battery depletion or blockage." },
    { section: 4, q: "Earmold tubing should be:", c: ["Changed every 6 months or when stiff/cracked", "Never changed", "Changed weekly", "Changed annually only"], a: 0, r: "Tubing degrades over time affecting acoustics and comfort." },
    { section: 4, q: "Wax guards should be:", c: ["Replaced monthly or when clogged", "Never replaced", "Replaced annually", "Optional"], a: 0, r: "Regular wax guard replacement prevents cerumen-related failures." },
    { section: 4, q: "Moisture in tubing appears as:", c: ["Visible condensation or droplets", "Normal appearance", "Discoloration", "Cracking"], a: 0, r: "Visible moisture in tubing degrades sound quality and must be cleared." },
    { section: 4, q: "Binaural benefit includes:", c: ["Better localization, speech in noise, loudness summation", "Cost savings", "Simpler fitting", "Longer battery life"], a: 0, r: "Two ears provide significant perceptual advantages over one." },
    { section: 4, q: "Acclimatization means:", c: ["Gradual adjustment to amplified sound", "Immediate adaptation", "Device malfunction", "Battery adjustment"], a: 0, r: "Brain requires time to adjust to new auditory input." },
    { section: 4, q: "Initial programming may be:", c: ["Slightly below target for new user comfort", "Maximum gain immediately", "Minimum gain always", "Random settings"], a: 0, r: "Some practitioners use gradual introduction to ease adaptation." },

    // Section 5 (60 questions) - Provide Continuing Care  
    { section: 5, q: "Typical first follow-up after fitting is:", c: ["1-2 weeks", "1 day", "3 months", "1 year"], a: 0, r: "Early follow-up (1-2 weeks) allows fine-tuning and counseling reinforcement." },
    { section: 5, q: "APHAB (Abbreviated Profile of Hearing Aid Benefit) measures:", c: ["Self-assessed benefit in various situations", "Objective gain", "Battery life", "Device quality"], a: 0, r: "APHAB is validated questionnaire comparing aided vs unaided function." },
    { section: 5, q: "APHAB subscales include:", c: ["EC (Ease of Communication), RV (Reverberation), BN (Background Noise), AV (Aversiveness)", "Only one scale", "Battery and cost", "Warranty terms"], a: 0, r: "Four APHAB subscales assess different listening environments." },
    { section: 5, q: "COSI (Client Oriented Scale of Improvement) uses:", c: ["Patient-specific listening goals", "Generic questionnaire", "Professional judgment only", "Manufacturer ratings"], a: 0, r: "COSI focuses on individual priority listening situations." },
    { section: 5, q: "COSI asks patient to identify:", c: ["5 priority listening situations", "10 situations", "No specific number", "One situation only"], a: 0, r: "COSI typically uses 5 patient-nominated goals." },
    { section: 5, q: "Outcome measures should be administered:", c: ["At fitting baseline and follow-up (4-8 weeks)", "Only at fitting", "Only if problems", "Never necessary"], a: 0, r: "Pre/post measurement demonstrates objective benefit." },
    { section: 5, q: "Annual hearing retest is important because:", c: ["Hearing may change requiring reprogramming", "Not necessary", "Warranty requirement", "Insurance mandate"], a: 0, r: "Hearing loss often progresses, requiring updated amplification." },
    { section: 5, q: "Deep cleaning and maintenance should occur:", c: ["Every 3-6 months professionally", "Only when broken", "Never needed", "Patient only"], a: 0, r: "Professional cleaning extends device life and maintains performance." },
    { section: 5, q: "Wax guards should be replaced:", c: ["Monthly or when clogged", "Never", "Annually", "Daily"], a: 0, r: "Regular wax guard changes prevent cerumen-related failures." },
    { section: 5, q: "Patient reports no sound. First troubleshooting step:", c: ["Check battery - replace or recharge", "Order new device", "Medical referral", "Reprogram device"], a: 0, r: "Battery is most common cause of dead hearing aid." },
    { section: 5, q: "Patient reports weak sound. Likely causes:", c: ["Low battery, cerumen blockage, moisture", "Programming error", "Permanent damage", "Patient hearing change only"], a: 0, r: "Weak sound often has simple mechanical causes." },
    { section: 5, q: "Patient reports intermittent sound. Check:", c: ["Battery contacts, moisture, loose connections", "Volume only", "Programming", "Replace device"], a: 0, r: "Intermittency suggests connection or moisture problems." },
    { section: 5, q: "Patient reports distorted sound. Investigate:", c: ["Cerumen blockage, damaged receiver, moisture", "Battery", "Volume", "Program selection"], a: 0, r: "Distortion indicates obstruction or component damage." },
    { section: 5, q: "Feedback/whistling troubleshooting includes:", c: ["Check insertion, seal, cerumen, gain settings", "Ignore if intermittent", "Automatic resolution", "Increase volume"], a: 0, r: "Feedback has multiple potential causes requiring systematic check." },
    { section: 5, q: "Device not charging. Check:", c: ["Charging contacts, power source, reset charger", "Replace device", "Medical referral", "Nothing to do"], a: 0, r: "Charging problems often involve contacts or power supply." },
    { section: 5, q: "Moisture damage prevention includes:", c: ["Dry-aid kit, dehumidifier, avoid water exposure", "No prevention possible", "Alcohol cleaning", "Submersion in water"], a: 0, r: "Regular dehumidification extends device life." },
    { section: 5, q: "Cerumen management for hearing aid users:", c: ["Regular professional cerumen checks/removal", "Never check", "Patient removal only", "Ignore cerumen"], a: 0, r: "Hearing aid use can increase cerumen impaction requiring monitoring." },
    { section: 5, q: "Non-use risk factors include:", c: ["Unrealistic expectations, poor fit, inadequate counseling", "Perfect fitting", "Excellent outcomes", "Low cost"], a: 0, r: "Identifying and addressing non-use risks improves success." },
    { section: 5, q: "Patient stops wearing hearing aids. Intervention:", c: ["Identify barriers, address concerns, additional counseling", "Accept non-use", "Immediate refund", "No follow-up"], a: 0, r: "Proactive problem-solving can rescue failing fittings." },
    { section: 5, q: "Communication strategies for patients include:", c: ["Face speaker, reduce noise, request clarification", "Avoid social situations", "Rely only on devices", "No additional strategies"], a: 0, r: "Multi-pronged approach maximizes communication success." },
    { section: 5, q: "Communication strategies for family include:", c: ["Get attention first, face-to-face, normal volume", "Shout at patient", "Speak from other room", "Avoid communication"], a: 0, r: "Family education improves overall communication environment." },
    { section: 5, q: "Aural rehabilitation includes:", c: ["Hearing loss education, communication strategies, psychosocial counseling", "Device fitting only", "Medical treatment", "Ignoring hearing loss"], a: 0, r: "Comprehensive rehab addresses multiple aspects beyond amplification." },
    { section: 5, q: "Auditory training exercises:", c: ["Improve speech discrimination through practice", "Cure hearing loss", "Replace hearing aids", "Not evidence-based"], a: 0, r: "Auditory training can enhance speech perception skills." },
    { section: 5, q: "Group aural rehabilitation benefits include:", c: ["Peer support, shared learning, reduced stigma", "Lower cost only", "Shorter sessions", "No added benefit"], a: 0, r: "Group sessions provide valuable social support component." },
    { section: 5, q: "Environmental modifications to improve listening:", c: ["Reduce reverberation, improve lighting, minimize noise", "No changes needed", "Amplify all sounds", "Isolate patient"], a: 0, r: "Physical environment significantly affects listening ease." },
    { section: 5, q: "Assistive listening devices (ALDs) include:", c: ["FM systems, loop systems, amplified phones", "Hearing aids only", "No other options", "Medical devices"], a: 0, r: "ALDs complement hearing aids for specific situations." },
    { section: 5, q: "Telecoil allows use of:", c: ["Loop systems in theaters, churches, venues", "Bluetooth only", "No benefit", "Medical equipment"], a: 0, r: "Telecoils access induction loop assistive systems." },
    { section: 5, q: "FM system benefit:", c: ["Improves signal-to-noise by placing mic near speaker", "No advantage", "Replaces hearing aids", "For home use only"], a: 0, r: "FM improves speech understanding in challenging environments." },
    { section: 5, q: "Captioning and visual supports:", c: ["Important adjunct to auditory input", "Replace hearing aids", "Only for deaf", "Not helpful"], a: 0, r: "Visual information enhances understanding beyond amplification alone." },
    { section: 5, q: "Tinnitus management strategies include:", c: ["Sound enrichment, counseling, amplification", "Silence", "Medication only", "Ignore symptoms"], a: 0, r: "Multi-modal approach helps tinnitus management." },
    { section: 5, q: "Device lifespan is typically:", c: ["5-7 years with proper care", "1-2 years", "10+ years", "Indefinite"], a: 0, r: "Modern devices last 5-7 years on average before replacement." },
    { section: 5, q: "Technology upgrade considerations include:", c: ["Feature improvements, hearing changes, lifestyle changes", "Cosmetics only", "Warranty expiration", "No valid reasons"], a: 0, r: "Multiple factors may warrant device replacement before failure." },
    { section: 5, q: "Warranty typically covers:", c: ["Manufacturing defects and repairs (1-3 years)", "Loss and damage", "Battery costs", "Lifetime guarantee"], a: 0, r: "Standard warranty covers defects, not loss or damage." },
    { section: 5, q: "Loss and damage insurance:", c: ["Optional coverage for replacement if lost/damaged", "Always included", "Not available", "Covers theft only"], a: 0, r: "Separate insurance available for loss and damage protection." },
    { section: 5, q: "Manufacturer repair process typically takes:", c: ["1-2 weeks", "Same day", "3-6 months", "Not possible"], a: 0, r: "Most repairs completed within 1-2 weeks." },
    { section: 5, q: "Loaner devices during repair:", c: ["Best practice to maintain patient function", "Never provided", "Charged extra", "Not necessary"], a: 0, r: "Loaner devices prevent communication breakdown during repair." },
    { section: 5, q: "Sudden hearing change while wearing devices:", c: ["Retest hearing, may need reprogramming", "Ignore", "Device malfunction only", "Normal aging"], a: 0, r: "Hearing changes require updated audiogram and reprogramming." },
    { section: 5, q: "Patient dissatisfaction should be addressed by:", c: ["Active listening, problem-solving, adjustments", "Immediate refund", "Blame patient", "Ignore complaints"], a: 0, r: "Proactive problem-solving often resolves dissatisfaction." },
    { section: 5, q: "Trial period allows:", c: ["Patient to evaluate benefit with return option", "No purpose", "Pressure to keep", "Manufacturer testing"], a: 0, r: "Trial periods reduce purchase risk and improve satisfaction." },
    { section: 5, q: "Documentation of follow-up visits should include:", c: ["Complaints, adjustments made, patient education, outcomes", "Date only", "No documentation needed", "Payment only"], a: 0, r: "Comprehensive documentation tracks progress and interventions." },
    { section: 5, q: "Return for credit should:", c: ["Follow state/manufacturer policies", "Never allowed", "Always full refund", "Professional discretion"], a: 0, r: "Return policies vary by state law and manufacturer terms." },
    { section: 5, q: "Continued care appointments should occur:", c: ["2 weeks, 4-8 weeks, then 3-6 months initially", "Only when broken", "Annually only", "Never after fitting"], a: 0, r: "Regular follow-up in first months optimizes adjustment." },
    { section: 5, q: "Long-term follow-up (after first year) typically:", c: ["Annual visits for hearing test and maintenance", "No follow-up needed", "Only if problems", "Monthly forever"], a: 0, r: "Annual check-ups monitor hearing and device function." },
    { section: 5, q: "Patient non-compliance with follow-up. Action:", c: ["Proactive outreach, identify barriers, convenient scheduling", "Accept loss of contact", "Discharge patient", "Bill for missed appointments"], a: 0, r: "Active re-engagement improves long-term success." },
    { section: 5, q: "Counseling on realistic expectations reduces:", c: ["Return rate and dissatisfaction", "Success rate", "Follow-up needs", "Device cost"], a: 0, r: "Proper expectation-setting is key to patient satisfaction." },
    { section: 5, q: "Successful hearing aid use requires:", c: ["Consistent wear, maintenance, follow-up, communication strategies", "Wearing occasionally", "No maintenance", "Devices alone"], a: 0, r: "Multi-faceted approach maximizes hearing aid benefit." },
    { section: 5, q: "Patient education materials should be:", c: ["Clear, written at appropriate level, multi-modal", "Technical and complex", "Verbal only", "Not provided"], a: 0, r: "Accessible education materials improve compliance and outcomes." },
    { section: 5, q: "Family involvement in rehabilitation:", c: ["Improves outcomes and communication", "Not necessary", "Delays progress", "Reduces compliance"], a: 0, r: "Family education and involvement significantly enhance success." },
    { section: 5, q: "Goal-setting with patient:", c: ["Increases motivation and satisfaction", "Wastes time", "Professional decision only", "Not evidence-based"], a: 0, r: "Collaborative goal-setting improves engagement and outcomes." },
    { section: 5, q: "Listening journals or logs can:", c: ["Track progress and identify problem situations", "No benefit", "Too burdensome", "Professional use only"], a: 0, r: "Self-monitoring helps patients and professionals optimize fitting." },
    { section: 5, q: "Smartphone apps for hearing aids allow:", c: ["Remote adjustments, streaming, personalization", "No benefit", "Replacement for professional care", "Not available"], a: 0, r: "Apps enhance user control and convenience." },
    { section: 5, q: "Remote programming/tele-audiology:", c: ["Allows adjustments without office visit", "Replaces all in-person care", "Not possible", "Lower quality care"], a: 0, r: "Telehealth expands access while maintaining quality." },
    { section: 5, q: "Data logging in hearing aids records:", c: ["Usage hours, program use, environment exposure", "Personal conversations", "Nothing useful", "Battery life only"], a: 0, r: "Data logging objectively tracks wearing patterns and environments." },
    { section: 5, q: "Non-use (hearing aids in drawer) is predicted by:", c: ["Poor benefit, discomfort, inadequate support", "Perfect fitting", "High technology", "Regular follow-up"], a: 0, r: "Multiple risk factors predict abandonment requiring intervention." },
    { section: 5, q: "Bilateral fitting is preferred because:", c: ["Localization, speech in noise, loudness summation, balance", "Cost savings", "Simpler programming", "One ear sufficient"], a: 0, r: "Two ears provide significant functional advantages." },
    { section: 5, q: "Gradual hearing aid introduction (increasing hours) may:", c: ["Ease adjustment for sensitive patients", "Delay adaptation", "Not evidence-based", "Always required"], a: 0, r: "Some patients benefit from gradual wearing schedule." },
    { section: 5, q: "Hearing aid benefit is maximized by:", c: ["Consistent use, proper maintenance, realistic expectations, follow-up", "Occasional use", "Ignoring problems", "Devices alone"], a: 0, r: "Comprehensive approach including patient engagement is essential." }
  ];
}

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', init);