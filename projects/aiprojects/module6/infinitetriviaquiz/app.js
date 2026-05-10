const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const topicLabel = document.getElementById('topic-label');
const progressLabel = document.getElementById('progress-label');
const questionText = document.getElementById('question-text');
const optionsGrid = document.getElementById('options-grid');
const feedbackBox = document.getElementById('feedback-box');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackExplanation = document.getElementById('feedback-explanation');
const nextBtn = document.getElementById('next-btn');

const apiModal = document.getElementById('api-modal');
const modalApiKeyInput = document.getElementById('modal-api-key');
const saveApiBtn = document.getElementById('save-api-btn');
const modalError = document.getElementById('modal-error');
const closeModalBtn = document.getElementById('close-modal-btn');
const settingsBtn = document.getElementById('settings-btn');

const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');

const topicListContainer = document.getElementById('topic-list');
const newTopicInput = document.getElementById('new-topic-input');
const addTopicBtn = document.getElementById('add-topic-btn');

const suggestBtn = document.getElementById('suggest-btn');
const deleteModal = document.getElementById('delete-modal');
const deleteModalText = document.getElementById('delete-modal-text');

const toastEl = document.getElementById('toast');

const DATA_STORAGE_KEY = 'infinite_trivia_quiz_data';
let quizData = JSON.parse(localStorage.getItem(DATA_STORAGE_KEY)) || {
    "Space Exploration": { questions: [], highScore: 0 },
    "Animal Kingdom": { questions: [], highScore: 0 },
    "History of Inventions": { questions: [], highScore: 0 },
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

let answered = 0;
let askedQuestions = [];
let currentTopic = "";

let unplayedQuestions = [];

const STORAGE_KEY = 'gemini_ai_api_key';
let currentApiKey = localStorage.getItem(STORAGE_KEY) || '';
let isForcedModal = false;

let pendingTopicToDelete = null;

function showApiModal(forced = false) {
    isForcedModal = forced;
    closeModalBtn.style.display = forced ? 'none' : 'block';
    modalApiKeyInput.value = currentApiKey;
    modalError.style.display = 'none';
    apiModal.style.display = 'flex';
}

function hideApiModal() { apiModal.style.display = 'none'; }

settingsBtn.addEventListener('click', () => showApiModal(false));
closeModalBtn.addEventListener('click', () => { if (!isForcedModal) hideApiModal(); });

saveApiBtn.addEventListener('click', async () => {
    const inputKey = modalApiKeyInput.value.trim();
    saveApiBtn.disabled = true; saveApiBtn.innerText = "Verifying...";
    modalError.style.display = 'none';

    if (await validateApiKey(inputKey)) {
        currentApiKey = inputKey;
        localStorage.setItem(STORAGE_KEY, currentApiKey);
        hideApiModal();
    } else {
        modalError.innerText = "Invalid API Key. Verification failed.";
        modalError.style.display = 'block';
    }
    saveApiBtn.disabled = false; saveApiBtn.innerText = "Verify & Save";
});

async function validateApiKey(key) {
    if (!key) return false;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:countTokens?key=${key}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] })
        });
        return res.ok;
    } catch (error) { return false; }
}

async function initializeApp() {
    if (currentApiKey) {
        if (!(await validateApiKey(currentApiKey))) {
            showApiModal(true);
        }
    } else {
        showApiModal(true);
    }
}
initializeApp();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function switchScreen(activeScreen) {
    homeScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    loadingScreen.classList.remove('active');
    activeScreen.classList.add('active');
}

function initHome() {
    renderTopics();
}
initHome();


function renderTopics() {
    topicListContainer.innerHTML = '';
    
    Object.keys(quizData).forEach((topic, index) => {
        const topicData = quizData[topic];
                
        const itemDiv = document.createElement('div');
        itemDiv.className = 'topic-item';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'topic-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'topic-name';
        nameSpan.innerText = topic;

        const statsSpan = document.createElement('span');
        statsSpan.className = 'topic-stats';
        if (topicData.questions.length > 0) {
            statsSpan.innerText = `🎯 High Score: ${topicData.highScore} / ${topicData.questions.length}`;
        } else {
            statsSpan.innerText = `🎯 Not played yet`;
        }

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(statsSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'topic-actions';

        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerText = '▶ Play';
        playBtn.onclick = () => {
            initializeQuiz(topic);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerText = '🗑️';
        deleteBtn.onclick = () => {
            if (topicData.questions.length > 0) {
                pendingTopicToDelete = topic;
                deleteModalText.innerText = `"${topic}" has ${topicData.questions.length} stored questions in your local cache. Are you sure you want to permanently delete it?`;
                deleteModal.style.display = 'flex';
            } else {
                delete quizData[topic];
                renderTopics();
                saveQuizData();
            }
        };

        actionsDiv.appendChild(playBtn);
        actionsDiv.appendChild(deleteBtn);
        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(actionsDiv);
        topicListContainer.appendChild(itemDiv);
    });
}

addTopicBtn.addEventListener('click', () => {
    const newTopic = newTopicInput.value.trim();
    if (newTopic && !quizData[newTopic]) {
        quizData[newTopic] = { questions: [], highScore: 0 };
        newTopicInput.value = '';
        renderTopics();
        saveQuizData();
    }
});

function saveQuizData() {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(quizData));
}

function initializeQuiz(topic){
    score = 0;
    answered = 0;
    unplayedQuestions = [...quizData[topic].questions];
    askedQuestions = [];
    unplayedQuestions.forEach(q => askedQuestions.push(q.question));
    unplayedQuestions = shuffleArray(unplayedQuestions);
    currentTopic = topic;
    startQuiz(topic);
}

async function prepareBatch(topic){
    if (unplayedQuestions.length >= 10){
        currentQuestions = unplayedQuestions.splice(0, 10);
    }else{
        await generateQuiz(topic);
    }
    answered += currentQuestions.length;
}

function startQuiz(topic) {
    currentQuestionIndex = 0;
    topicLabel.innerText = `Topic: ${topic}`;
    
    async function callGenerateQuiz (){
        try{
            await prepareBatch(topic)
            switchScreen(quizScreen);
            loadQuestion();
        }catch(error){
            showToast(`Generation Failed: ${error.message}`, "error");
            if (answered === 0) {
                switchScreen(homeScreen);
            } else {
                switchScreen(resultScreen);
            }
        }
    }
    callGenerateQuiz();
}

async function generateQuiz(topic){
    switchScreen(loadingScreen);
    loadingText.innerText = `The AI is generating unique questions about ${topic}...`;

    let prompt = `Generate exactly 10 multiple-choice trivia questions about "${topic}".`;
    if (askedQuestions.length > 0) {
        const excludeList = askedQuestions.map(q => `- ${q}`).join("\n");
        prompt += `\n\nCRITICAL INSTRUCTION: Do NOT generate questions that are similar to the following:\n${excludeList}`;
    }

    const jsonSchema = {
        type: "ARRAY",
        description: "A list of 10 trivia questions.",
        items: {
            type: "OBJECT",
            properties: {
                question: { type: "STRING" },
                options: { 
                    type: "ARRAY", 
                    items: { type: "STRING" },
                    description: "Exactly 4 options."
                },
                answer: { type: "STRING", description: "The exact string of the correct option." },
                explanation: { type: "STRING", description: "A short explanation of why it is correct." }
            },
            required: ["question", "options", "answer", "explanation"]
        }
    };

    const model = `gemini-3-flash-preview`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema
        }
    };
    const request = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-goog-api-key' : currentApiKey
        },
        body: JSON.stringify(payload)
    }

    const response = await fetch(url, request);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Error");
    const rawText = data.candidates[0].content.parts[0].text;
    const newQuestions = JSON.parse(rawText);
    newQuestions.forEach(q => askedQuestions.push(q.question));
    currentQuestions = newQuestions;
    newQuestions.forEach(q => quizData[topic].questions.push(q));
    saveQuizData();
}

function loadQuestion() {
    feedbackBox.classList.remove('show');
    optionsGrid.innerHTML = '';
    
    const qData = currentQuestions[currentQuestionIndex];
    const offset = answered - currentQuestions.length;
    progressLabel.innerText = `Question ${offset + currentQuestionIndex + 1} / ${offset + currentQuestions.length}`;
    questionText.innerText = qData.question;

    const options = shuffleArray([...qData.options]);
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => checkAnswer(btn, option, qData.answer, qData.explanation);
        optionsGrid.appendChild(btn);
    });
}

function checkAnswer(selectedBtn, selectedText, correctAnswer, explanation) {
    const allButtons = optionsGrid.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    const isCorrect = (selectedText === correctAnswer);

    if (isCorrect) {
        score++;
        selectedBtn.classList.add('correct');
        feedbackTitle.innerText = "✅ Correct!";
        feedbackTitle.style.color = "var(--correct)";
        feedbackBox.style.backgroundColor = "#ecfdf5";
    } else {
        selectedBtn.classList.add('wrong');
        feedbackTitle.innerText = `❌ Incorrect. The answer is ${correctAnswer}.`;
        feedbackTitle.style.color = "var(--wrong)";
        feedbackBox.style.backgroundColor = "#fef2f2";

        allButtons.forEach(btn => {
            if (btn.innerText === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    feedbackExplanation.innerText = explanation;

    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerText = "Checkpoint ➔";
    } else {
        nextBtn.innerText = "Next Question ➔";
    }

    feedbackBox.classList.add('show');
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    if (score > quizData[currentTopic].highScore){
        quizData[currentTopic].highScore = score;
        saveQuizData();
    }
    const scoreText = document.getElementById('score-text');
    const resultMessage = document.getElementById('result-message');
    scoreText.innerText = `${score} / ${answered}`;

    const percentage = score / answered;
    if (percentage === 1) resultMessage.innerText = "Flawless streak! Keep it up! 🏆";
    else if (percentage >= 0.7) resultMessage.innerText = "Doing great! Ready for more? 👍";
    else resultMessage.innerText = "Good effort! Let's try to improve. 📚";
    
    switchScreen(resultScreen);
}

document.getElementById('stop-btn').addEventListener('click', () => {
    renderTopics();
    switchScreen(homeScreen);
});

document.getElementById('continue-btn').addEventListener('click', () => {
    startQuiz(currentTopic);
});

suggestBtn.addEventListener('click', async () => {
    if (!currentApiKey) { showApiModal(true); return; }
    suggestBtn.disabled = true;
    suggestBtn.innerText = "Thinking...";

    try {
        const prompt = "Suggest exactly one short, fun, and unique trivia topic category (maximum 4 words). Do not use markdown, quotes, or conversational filler. Example: 'Ancient Egypt' or '90s Pop Music'.";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
        const response = await fetch(url, {
            method: 'POST', headers: { 
                'Content-Type': 'application/json',
                'X-goog-api-key' : currentApiKey },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "text/plain" }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error("API Error");
        const suggestion = data.candidates[0].content.parts[0].text.trim().replace(/["']/g, "");
        newTopicInput.value = suggestion;

    } catch (error) {
        console.error(error);
        showToast("Failed to get suggestion. Check API key.", "error");
    } finally {
        suggestBtn.disabled = false;
        suggestBtn.innerText = "✨ Suggest";
    }
});

document.getElementById('cancel-delete-btn').addEventListener('click', () => {
    deleteModal.style.display = 'none';
    pendingTopicToDelete = null;
});

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (pendingTopicToDelete) {
        delete quizData[pendingTopicToDelete];
        renderTopics();
        saveQuizData();
    }
    deleteModal.style.display = 'none';
    pendingTopicToDelete = null;
});

document.getElementById('export-btn').addEventListener('click', () => {
    const dataStr = JSON.stringify(quizData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trivia_memory_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Trivia Data downloaded!", "success");
});

const importInput = document.getElementById('import-file');
document.getElementById('import-btn').addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            if (typeof importedData === 'object' && !Array.isArray(importedData)) {
                quizData = { ...quizData, ...importedData }; 
                saveQuizData();
                renderTopics();
                showToast("Data imported successfully!", "success");
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            showToast("Failed to import. The file is not a valid Trivia Data JSON.", "error");
        }
    };
    reader.readAsText(file);
    importInput.value = ''; 
});

let toastTimeout = null;
function showToast(message, type = 'success') {
    toastEl.innerText = message;
    toastEl.className = `show ${type}`;
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.className = toastEl.className.replace('show', '').trim();
    }, 3000);
}    