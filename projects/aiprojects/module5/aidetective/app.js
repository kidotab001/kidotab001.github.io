const apiKeyInput = document.getElementById('api-key');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const evidenceBox = document.getElementById('evidence-box');
const imagePreview = document.getElementById('image-preview');
const placeholder = document.getElementById('placeholder-text');
const promptInput = document.getElementById('prompt-input');
const analyzeBtn = document.getElementById('analyze-btn');
const reportCard = document.getElementById('report-card');

const settingsBtn = document.getElementById('settings-btn');
const apiModal = document.getElementById('api-modal');
const saveApiBtn = document.getElementById('save-api-btn');
const modalError = document.getElementById('modal-error');
const closeModalBtn = document.getElementById('close-modal-btn');

const focusBtn = document.getElementById('focus-btn');
const focusRing = document.getElementById('focus-ring');

const webSearchToggle = document.getElementById('web-search-toggle');
const elaborationSelect = document.getElementById('elaboration-select');

const STORAGE_KEY = 'gemini_ai_api_key';
let currentApiKey = localStorage.getItem(STORAGE_KEY) || '';
analyzeBtn.disabled = true;
focusBtn.disabled = true;

let currentBase64Image = null;
let currentMimeType = null;
let originalImageObj = new Image();

let isRingActive = false;
let isDragging = false;
let ringSize = 100;
let dragOffsetX = 0, dragOffsetY = 0;
let initialPinchDist = null;
let initialPinchSize = null;

let latestRawOutput = ""; 
let isGenerating = false;
let abortController = null;


uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        originalImageObj.src = e.target.result; 
        imagePreview.style.display = 'block';
        placeholder.style.display = 'none';

        currentBase64Image = e.target.result.split(',')[1];
        currentMimeType = file.type;

        analyzeBtn.disabled = false;
        focusBtn.disabled = false;
    };
    reader.readAsDataURL(file);
});

analyzeBtn.addEventListener('click', async () => {
    if (isGenerating) {
        if (abortController) abortController.abort();
        return;
    }

    const apiKey = currentApiKey;
    let prompt = promptInput.value.trim() || "Describe this image in detail.";
    let payloadBase64 = currentBase64Image;        
    if (isRingActive) {
        prompt += " Please pay special attention to the area enclosed by the red circle.";
        payloadBase64 = applyRingToImage();
    }

    uploadBtn.disabled = true;
    isGenerating = true;
    abortController = new AbortController();
    analyzeBtn.innerText = "Stop";
    analyzeBtn.classList.add('stop-btn');
    focusBtn.disabled = true;
    latestRawOutput = "";
    reportCard.innerHTML = '<span class="loading">Analyzing evidence...</span>';

    let systemInstructionText = "You are a sharp, observant detective analyzing evidence. Be direct and straight to the point.";       
    if (isRingActive) {
        systemInstructionText += " The user has drawn a red circle on the image. Focus your analysis strictly within the area enclosed by the red circle.";
        payloadBase64 = applyRingToImage();
    }

    const elaboration = elaborationSelect.value;
    if (elaboration === "none") {
        systemInstructionText += " Provide ONLY the direct answer or identification. Absolutely no elaboration or extra details.";
    } else if (elaboration === "brief") {
        systemInstructionText += " Provide a short, concise description of your findings.";
    } else if (elaboration === "detailed") {
        systemInstructionText += " Provide a highly detailed and thorough analysis of the evidence.";
    }
    
    const payload = {
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: currentMimeType,
                            data: payloadBase64
                        }
                    }
                ]
            }
        ]
    };

    const model = 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

    const request = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-goog-api-key' : apiKey
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
    };

    try {
        const response = await fetch(url, request);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        reportCard.innerHTML = "";

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(dataStr);
                        const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        latestRawOutput += chunkText;

                        reportCard.innerHTML = parseMarkdown(latestRawOutput);

                        reportCard.scrollTop = reportCard.scrollHeight;
                    } catch (e) {
                        console.warn("Stream parsing error on chunk:", e);
                    }
                }
            }
        }
    }catch(error){
        if (error.name === 'AbortError') {
            latestRawOutput += "\n\n*[Analysis Interrupted]*";
            reportCard.innerHTML = parseMarkdown(latestRawOutput);
        } else {
            console.error(error);
            reportCard.innerText = "❌ Analysis Failed: " + error.message;
        }
    }finally {
        uploadBtn.disabled = false;
        isGenerating = false;
        analyzeBtn.innerText = "Analyze";
        analyzeBtn.classList.remove('stop-btn');
        abortController = null;
        focusBtn.disabled = false;
    }
});

function parseMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
}

settingsBtn.addEventListener('click', () => {
    showApiModal(false);
})

function showApiModal() {
    modalError.style.display = 'none';
    closeModalBtn.style.display = 'block';
    apiModal.style.display = 'flex';
    apiKeyInput.value = currentApiKey;
}

closeModalBtn.addEventListener('click', () => { 
    hideApiModal(); 
});

function hideApiModal() { 
    apiModal.style.display = 'none'; 
}

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

saveApiBtn.addEventListener('click', async () => {
    const inputKey = apiKeyInput.value.trim();
    saveApiBtn.disabled = true; 
    saveApiBtn.innerText = "Verifying...";
    modalError.style.display = 'none';

    if (await validateApiKey(inputKey)) {
        currentApiKey = inputKey;
        localStorage.setItem(STORAGE_KEY, currentApiKey);
        hideApiModal();
    } else {
        modalError.innerText = "Invalid API Key. Verification failed.";
        modalError.style.display = 'block';
    }
    saveApiBtn.disabled = false; 
    saveApiBtn.innerText = "Verify & Save";
});



focusBtn.addEventListener('click', toggleFocusRing);

function toggleFocusRing() {
    isRingActive = !isRingActive;
    
    if (isRingActive) {
        focusBtn.classList.add('active');
        focusRing.style.display = 'block';
        ringSize = 100;
        focusRing.style.width = ringSize + 'px';
        focusRing.style.height = ringSize + 'px';
        focusRing.style.top = '50%';
        focusRing.style.left = '50%';
        focusRing.style.transform = 'translate(-50%, -50%)';
        promptInput.placeholder = "What is this?";
    } else {
        focusBtn.classList.remove('active');
        focusRing.style.display = 'none';
        promptInput.placeholder = "What do you see?";
    }
}

focusRing.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);

focusRing.addEventListener('touchstart', startDrag, {passive: false});
window.addEventListener('touchmove', doDrag, {passive: false});
window.addEventListener('touchend', endDrag);

function startDrag(e) {
    if (!isRingActive) return;
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = focusRing.getBoundingClientRect();
    dragOffsetX = clientX - (rect.left + rect.width / 2);
    dragOffsetY = clientY - (rect.top + rect.height / 2);
}

function doDrag(e) {
    if (!isDragging || !isRingActive) return;

    if(e.touches) e.preventDefault(); 
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const boxRect = evidenceBox.getBoundingClientRect();
    
    let newLeft = clientX - boxRect.left - dragOffsetX;
    let newTop = clientY - boxRect.top - dragOffsetY;

    focusRing.style.left = newLeft + 'px';
    focusRing.style.top = newTop + 'px';
}

function endDrag() { isDragging = false; }

evidenceBox.addEventListener('wheel', (e) => {
    if (!isRingActive) return;
    e.preventDefault();
    ringSize += e.deltaY > 0 ? -10 : 10;
    ringSize = Math.max(40, Math.min(ringSize, 300)); // Clamp size
    focusRing.style.width = ringSize + 'px';
    focusRing.style.height = ringSize + 'px';
});

evidenceBox.addEventListener('touchmove', (e) => {
    if (isRingActive && e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialPinchDist === null) {
            initialPinchDist = dist;
            initialPinchSize = ringSize;
        } else {
            const delta = dist - initialPinchDist;
            ringSize = Math.max(40, Math.min(initialPinchSize + delta, 300));
            focusRing.style.width = ringSize + 'px';
            focusRing.style.height = ringSize + 'px';
        }
    }
}, {passive: false});

evidenceBox.addEventListener('touchend', () => initialPinchDist = null);

function applyRingToImage() {
    if (!isRingActive) return currentBase64Image;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = originalImageObj.naturalWidth;
    canvas.height = originalImageObj.naturalHeight;
    ctx.drawImage(originalImageObj, 0, 0);

    const imgRect = imagePreview.getBoundingClientRect();
    const ringRect = focusRing.getBoundingClientRect();
    
    const scaleX = canvas.width / imgRect.width;
    const scaleY = canvas.height / imgRect.height;

    const domCenterX = ringRect.left - imgRect.left + (ringRect.width / 2);
    const domCenterY = ringRect.top - imgRect.top + (ringRect.height / 2);

    const canvasX = domCenterX * scaleX;
    const canvasY = domCenterY * scaleY;
    const canvasRadius = (ringRect.width / 2) * scaleX;

    ctx.beginPath();
    ctx.arc(canvasX, canvasY, canvasRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 6 * scaleX; 
    ctx.strokeStyle = '#ff0000'; 
    ctx.stroke();

    ctx.lineWidth = 2 * scaleX;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    return canvas.toDataURL(currentMimeType).split(',')[1];
}