// Texas ILE Practice Exam Application
let questions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let answers = {};
let flaggedQuestions = new Set();
let hasSubmittedAnswer = false;

// Load questions from JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questions = data.questions;
        console.log(`Loaded ${questions.length} questions`);
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please refresh the page.');
    }
}

// Show/hide screens
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showWelcome() {
    showScreen('welcomeScreen');
    currentQuestionIndex = 0;
    answers = {};
    flaggedQuestions.clear();
    hasSubmittedAnswer = false;
}

async function startExam() {
    if (questions.length === 0) {
        await loadQuestions();
    }
    
    // Randomize answer choices for all questions
    questions.forEach(q => {
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
    });
    
    currentQuestionIndex = 0;
    answers = {};
    hasSubmittedAnswer = false;
    showScreen('questionScreen');
    displayQuestion();
}

function displayQuestion() {
    const question = questions[currentQuestionIndex];
    if (!question) return;
    
    hasSubmittedAnswer = answers[currentQuestionIndex] !== undefined;
    
    // Update header
    const sectionNames = {
        1: "Section 1: Assessment",
        2: "Section 2: Interpretation",
        3: "Section 3: Device Selection",
        4: "Section 4: Fitting",
        5: "Section 5: Texas Jurisprudence"
    };
    
    document.getElementById('sectionLabel').textContent = sectionNames[question.section] || `Section ${question.section}`;
    document.getElementById('questionProgress').textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    
    // Update progress bar
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Update score display
    const answered = Object.keys(answers).length;
    let correct = 0;
    Object.keys(answers).forEach(idx => {
        const q = questions[idx];
        const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
        if (answers[idx] === correctIdx) correct++;
    });
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    document.getElementById('scoreDisplay').textContent = 
        `Answered: ${answered}/${questions.length} | Current Score: ${correct}/${answered} (${percentage}%)`;
    
    // Update flag button
    const flagText = document.getElementById('flagText');
    const flagBtn = document.getElementById('flagBtn');
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flagText.textContent = 'Flagged';
        flagBtn.classList.add('flagged');
    } else {
        flagText.textContent = 'Flag';
        flagBtn.classList.remove('flagged');
    }
    
    // Display question
    document.getElementById('questionText').textContent = `${currentQuestionIndex + 1}. ${question.question}`;
    
    // Display choices
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    
    question.shuffledChoices.forEach((choice, index) => {
        const choiceDiv = document.createElement('div');
        choiceDiv.className = 'choice';
        
        if (hasSubmittedAnswer) {
            choiceDiv.classList.add('disabled');
            const correctIdx = question.shuffledAnswerIndex;
            if (index === correctIdx) {
                choiceDiv.classList.add('correct');
            }
            if (index === answers[currentQuestionIndex] && index !== correctIdx) {
                choiceDiv.classList.add('incorrect');
            }
        } else {
            if (selectedAnswer === index) {
                choiceDiv.classList.add('selected');
            }
            choiceDiv.onclick = () => selectChoice(index);
        }
        
        choiceDiv.innerHTML = `
            <span class="choice-letter">${letters[index]}</span>
            <span class="choice-text">${choice}</span>
        `;
        
        choicesContainer.appendChild(choiceDiv);
    });
    
    // Show/hide feedback
    const feedback = document.getElementById('feedback');
    if (hasSubmittedAnswer) {
        showFeedback();
    } else {
        feedback.style.display = 'none';
    }
    
    // Update navigation buttons
    document.getElementById('prevBtn').style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('submitAnswerBtn').style.display = hasSubmittedAnswer ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = hasSubmittedAnswer ? 'inline-block' : 'none';
    document.getElementById('submitAnswerBtn').disabled = selectedAnswer === null;
    
    // Show finish button on last question if answered
    if (currentQuestionIndex === questions.length - 1 && hasSubmittedAnswer) {
        document.getElementById('finishBtn').style.display = 'block';
    } else {
        document.getElementById('finishBtn').style.display = 'none';
    }
}

function selectChoice(index) {
    if (hasSubmittedAnswer) return;
    selectedAnswer = index;
    displayQuestion();
}

function submitAnswer() {
    if (selectedAnswer === null || hasSubmittedAnswer) return;
    
    answers[currentQuestionIndex] = selectedAnswer;
    hasSubmittedAnswer = true;
    selectedAnswer = null;
    displayQuestion();
}

function showFeedback() {
    const question = questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestionIndex];
    const correctIdx = question.shuffledAnswerIndex;
    const isCorrect = userAnswer === correctIdx;
    
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'block';
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const correctAnswerText = question.choices[question.answerIndex];
    
    feedback.innerHTML = `
        <span class="feedback-status ${isCorrect ? 'status-correct' : 'status-incorrect'}">
            ${isCorrect ? 'Correct' : 'Incorrect'}
        </span>
        <div class="feedback-content">
            <strong>Correct Answer:</strong> ${correctAnswerText}<br><br>
            <strong>Explanation:</strong> ${question.rationale}
        </div>
    `;
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        selectedAnswer = null;
        hasSubmittedAnswer = answers[currentQuestionIndex] !== undefined;
        displayQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        selectedAnswer = null;
        hasSubmittedAnswer = answers[currentQuestionIndex] !== undefined;
        displayQuestion();
    }
}

function toggleFlag() {
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flaggedQuestions.delete(currentQuestionIndex);
    } else {
        flaggedQuestions.add(currentQuestionIndex);
    }
    displayQuestion();
}

function finishExam() {
    showResults();
}

function showResults() {
    showScreen('resultsScreen');
    
    // Calculate overall score
    let correct = 0;
    const total = questions.length;
    
    questions.forEach((q, idx) => {
        const userAnswer = answers[idx];
        if (userAnswer !== undefined) {
            const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
            if (userAnswer === correctIdx) correct++;
        }
    });
    
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= 70;
    
    // Display final score
    document.getElementById('finalScore').textContent = `${correct}/${total} (${percentage}%)`;
    
    const performanceLabel = document.getElementById('performanceLabel');
    performanceLabel.className = `performance-label ${passed ? 'pass' : 'fail'}`;
    performanceLabel.textContent = passed ? 'PASSED' : 'FAILED';
    
    // Section breakdown
    const sectionScores = {};
    questions.forEach((q, idx) => {
        if (!sectionScores[q.section]) {
            sectionScores[q.section] = { correct: 0, total: 0 };
        }
        sectionScores[q.section].total++;
        
        const userAnswer = answers[idx];
        if (userAnswer !== undefined) {
            const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
            if (userAnswer === correctIdx) {
                sectionScores[q.section].correct++;
            }
        }
    });
    
    const sectionNames = {
        1: 'Section 1: Patient/Client Assessment',
        2: 'Section 2: Interpret & Apply Assessment Results',
        3: 'Section 3: Select Hearing Devices',
        4: 'Section 4: Fit & Dispense Hearing Devices',
        5: 'Section 5: Texas Jurisprudence & Continuing Care'
    };
    
    let breakdownHTML = '<h3>Performance by Section</h3>';
    for (let section in sectionScores) {
        const score = sectionScores[section];
        const pct = Math.round((score.correct / score.total) * 100);
        const scoreClass = pct >= 70 ? 'good' : 'poor';
        breakdownHTML += `
            <div class="section-result">
                <span class="section-name">${sectionNames[section]}</span>
                <span class="section-score ${scoreClass}">${score.correct}/${score.total} (${pct}%)</span>
            </div>
        `;
    }
    
    document.getElementById('resultsBreakdown').innerHTML = breakdownHTML;
    
    // Show review section with all questions
    let reviewHTML = '<h3>Detailed Review</h3>';
    questions.forEach((q, idx) => {
        const userAnswer = answers[idx];
        if (userAnswer === undefined) return; // Skip unanswered
        
        const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
        const isCorrect = userAnswer === correctIdx;
        
        const userAnswerText = q.shuffledChoices ? q.shuffledChoices[userAnswer] : q.choices[userAnswer];
        const correctAnswerText = q.choices[q.answerIndex];
        
        reviewHTML += `
            <div class="review-question ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-header">
                    <span class="review-number">Question ${idx + 1}</span>
                    <span class="review-status ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>
                <div class="review-text">${q.question}</div>
                <div class="review-answers">
                    <strong>Your Answer:</strong> ${userAnswerText}<br>
                    <strong>Correct Answer:</strong> ${correctAnswerText}
                </div>
                <div class="review-rationale">
                    <strong>Explanation:</strong> ${q.rationale}
                </div>
            </div>
        `;
    });
    
    document.getElementById('reviewSection').innerHTML = reviewHTML;
    
    // Show/hide review missed button
    const missedCount = questions.filter((q, idx) => {
        const userAnswer = answers[idx];
        if (userAnswer === undefined) return false;
        const correctIdx = q.shuffledAnswerIndex !== undefined ? q.shuffledAnswerIndex : q.answerIndex;
        return userAnswer !== correctIdx;
    }).length;
    
    document.getElementById('reviewMissedBtn').style.display = missedCount > 0 ? 'inline-block' : 'none';
}

function retakeExam() {
    answers = {};
    currentQuestionIndex = 0;
    selectedAnswer = null;
    flaggedQuestions.clear();
    hasSubmittedAnswer = false;
    
    // Re-randomize answers
    questions.forEach(q => {
        delete q.shuffledChoices;
        delete q.shuffledAnswerIndex;
    });
    
    startExam();
}

function reviewMissed() {
    // Find first missed question
    for (let i = 0; i < questions.length; i++) {
        const userAnswer = answers[i];
        if (userAnswer === undefined) continue;
        const correctIdx = questions[i].shuffledAnswerIndex !== undefined ? questions[i].shuffledAnswerIndex : questions[i].answerIndex;
        if (userAnswer !== correctIdx) {
            currentQuestionIndex = i;
            showScreen('questionScreen');
            displayQuestion();
            return;
        }
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});

