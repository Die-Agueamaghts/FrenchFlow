if (typeof CATEGORIES === 'undefined') {
    console.error('CATEGORIES is not defined. Include categories.js before script.js');
}

// expose category arrays as before for backward compatibility
const { legumes, fruits, spices, herbs, inner_organs, dishes } = CATEGORIES || {};

let currentCategory = "all";
let currentMode = "learning";
let correctCount = 0;
let incorrectCount = 0;
let totalCount = 0;
let isBlocked = false;
let isSessionActive = true;
let imageItems = [];
let pendingItems = [];
let currentItem = null;
let lastShownPath = null;
let currentRunSessionCounted = false;

let imageDisplay;
let inputField;
let feedbackElement;
let streakMessageElement;
let counterCorrectElement;
let counterIncorrectElement;
let counterTotalElement;
let currentGradeElement;
let categorySelect;
let answerForm;
let playButton;
let finishButton;
let modeInputs;
let gameArea;
let usernameInput;
let userResultsSection;
let showResultsButton;
let clearResultsButton;

function getImagesForCategory(selection) {
    if (selection && selection !== 'all' && CATEGORIES && CATEGORIES[selection]) {
        return [...CATEGORIES[selection]];
    }
    // return flattened list of all categories
    return CATEGORIES ? Object.values(CATEGORIES).flat() : [];
}

function getStorageKey() {
    const username = (usernameInput?.value || "").trim().toLowerCase() || "guest";
    return `vokabeltrainer-progress-${username}`;
}

function getResultsStorageKey(usernameOverride) {
    const username = (usernameOverride || usernameInput?.value || "").trim().toLowerCase() || "guest";
    return `vokabeltrainer-results-${username}`;
}

function loadProgress() {
    try {
        const savedProgress = localStorage.getItem(getStorageKey());
        return savedProgress ? JSON.parse(savedProgress) : {};
    } catch (error) {
        return {};
    }
}

function saveProgress() {
    const progress = {};
    imageItems.forEach((item) => {
        progress[item.path] = {
            priority: item.priority,
            streak: item.streak,
            learned: item.learned
        };
    });
    localStorage.setItem(getStorageKey(), JSON.stringify(progress));
}

function loadUserResults(usernameOverride) {
    try {
        const savedResults = localStorage.getItem(getResultsStorageKey(usernameOverride));
        return savedResults ? JSON.parse(savedResults) : { correct: 0, incorrect: 0, sessions: 0, lastUpdated: null };
    } catch (error) {
        return { correct: 0, incorrect: 0, sessions: 0, lastUpdated: null };
    }
}

function saveUserResults(results, usernameOverride) {
    localStorage.setItem(getResultsStorageKey(usernameOverride), JSON.stringify(results));
}

function updateUserResultStats(isCorrect) {
    const username = (usernameInput?.value || "").trim().toLowerCase() || "guest";
    const results = loadUserResults(username);
    if (isCorrect) {
        results.correct += 1;
    } else {
        results.incorrect += 1;
    }
    results.lastUpdated = new Date().toISOString();
    saveUserResults(results, username);
}

function recordSessionStart() {
    if (currentRunSessionCounted) {
        return;
    }

    currentRunSessionCounted = true;
    const username = (usernameInput?.value || "").trim().toLowerCase() || "guest";
    const results = loadUserResults(username);
    results.sessions += 1;
    results.lastUpdated = new Date().toISOString();
    saveUserResults(results, username);
}

function buildImageItems(selection) {
    const paths = getImagesForCategory(selection);
    const savedProgress = loadProgress();
    return paths.map((path) => {
        const savedItem = savedProgress[path] || {};
        return {
            path,
            priority: savedItem.priority || 0,
            streak: savedItem.streak || 0,
            learned: Boolean(savedItem.learned)
        };
    });
}

function shuffleItems(items) {
    const shuffledItems = [...items];
    shuffledItems.sort(() => Math.random() - 0.5);
    return shuffledItems;
}

function getSolution(filePath) {
    const fileName = filePath.split('/').pop();
    return fileName.split('.').slice(0, -1).join('.');
}

function calculateGrade() {
    if (totalCount === 0) return "-";
    const successRate = (correctCount / totalCount) * 100;

    if (successRate >= 91) return "1";
    if (successRate >= 81) return "2";
    if (successRate >= 71) return "3";
    if (successRate >= 61) return "4";
    if (successRate >= 50) return "5";
    return "6";
}

function updateStats() {
    counterCorrectElement.textContent = correctCount;
    counterIncorrectElement.textContent = incorrectCount;
    counterTotalElement.textContent = totalCount;
    currentGradeElement.textContent = calculateGrade();
}

function updateStreakMessage() {
    if (!streakMessageElement) {
        return;
    }
    if (!currentItem || currentItem.streak < 2) {
        streakMessageElement.textContent = "";
        return;
    }
    streakMessageElement.textContent = `Super! ${currentItem.streak} richtige in Folge 🔥`;
}

function renderGameArea() {
    const isTestingMode = currentMode === "testing";
    gameArea.className = isTestingMode ? "mode-testing" : "mode-learning";
    gameArea.innerHTML = `
        <div class="game-card">
            <div class="mode-banner ${isTestingMode ? "testing" : "learning"}">
                ${isTestingMode ? "🧪 Testmodus – direkt antworten" : "📘 Lernmodus – hör dir die Lösung an und prüfe sie"}
            </div>
            <img id="image-display" src="" alt="Vokabel Bild">
            ${isTestingMode ? "" : '<button id="play-button" type="button" class="btn-secondary">🔊 Vorlesen</button>'}
            <br>
            <form id="answer-form" action="javascript:void(0);">
                <input type="text" id="input-field" placeholder="Antwort hier eintippen..." autocomplete="off" autofocus>
                <button type="submit">Prüfen</button>
            </form>
            <div id="feedback"></div>
            <div id="streak-message" class="streak-message"></div>
        </div>
    `;
}

function bindGameElements() {
    imageDisplay = document.getElementById("image-display");
    inputField = document.getElementById("input-field");
    feedbackElement = document.getElementById("feedback");
    streakMessageElement = document.getElementById("streak-message");
    answerForm = document.getElementById("answer-form");
    playButton = document.getElementById("play-button");

    answerForm.addEventListener("submit", handleAnswer);
    if (playButton) {
        playButton.addEventListener("click", speakCurrentSolution);
    }
}

function updateModeControls() {
    finishButton.style.display = currentMode === "learning" ? "inline-block" : "none";
}

function buildPendingItems(items) {
    const queue = [];
    const pool = [...items];
    let previousPath = null;

    while (pool.length > 0) {
        const candidates = pool.filter((item) => item.path !== previousPath);
        const availableCandidates = candidates.length > 0 ? candidates : pool;
        const selectedIndex = Math.floor(Math.random() * availableCandidates.length);
        const selectedItem = availableCandidates[selectedIndex];

        queue.push(selectedItem);
        previousPath = selectedItem.path;
        pool.splice(pool.indexOf(selectedItem), 1);
    }

    return queue;
}

function pickNextItem() {
    const availableItems = imageItems.filter((item) => !item.learned && item.path !== lastShownPath);
    if (!availableItems.length) {
        const fallbackItems = imageItems.filter((item) => !item.learned);
        if (!fallbackItems.length) {
            return null;
        }
        return fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
    }

    const highestPriority = Math.max(...availableItems.map((item) => item.priority));
    const priorityItems = availableItems.filter((item) => item.priority === highestPriority);
    const weightedItems = [];

    priorityItems.forEach((item) => {
        const weight = Math.max(1, 4 - item.priority);
        for (let index = 0; index < weight; index += 1) {
            weightedItems.push(item);
        }
    });

    return weightedItems[Math.floor(Math.random() * weightedItems.length)];
}

function loadNextImage() {
    if (!isSessionActive) {
        return;
    }

    // Use the session queue so each image is shown once per run.
    if (!pendingItems.length) {
        showFinalResults();
        return;
    }
    currentItem = pendingItems.shift();

    lastShownPath = currentItem.path;
    imageDisplay.src = currentItem.path;
    inputField.value = "";
    if (streakMessageElement) {
        streakMessageElement.textContent = "";
    }
    inputField.focus();
    isBlocked = false;
}

function speakCurrentSolution() {
    if (!imageItems.length || currentMode !== "learning" || !currentItem) {
        return;
    }

    if (!("speechSynthesis" in window)) {
        feedbackElement.textContent = "Sprachsynthese wird in diesem Browser nicht unterstützt.";
        feedbackElement.className = "incorrect";
        return;
    }

    const solution = getSolution(currentItem.path);
    const utterance = new SpeechSynthesisUtterance(solution);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((voice) => voice.lang === "fr-FR") || voices.find((voice) => voice.lang.startsWith("fr"));
    if (frenchVoice) {
        utterance.voice = frenchVoice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function handleAnswer(event) {
    event.preventDefault();
    if (!isSessionActive || isBlocked || !inputField || !currentItem) {
        return;
    }

    const userInput = inputField.value.trim().toLowerCase();
    const correctAnswer = getSolution(currentItem.path).toLowerCase();

    isBlocked = true;
    recordSessionStart();
    totalCount++;

    if (userInput === correctAnswer) {
        feedbackElement.textContent = "Richtig! 🎉";
        feedbackElement.className = "correct";
        correctCount++;
        updateUserResultStats(true);
        currentItem.streak += 1;
        currentItem.priority = Math.max(0, currentItem.priority - 1);
        if (currentItem.streak >= 2) {
            currentItem.learned = true;
        }
        updateStreakMessage();
    } else {
        feedbackElement.textContent = `Falsch! Richtig: ${getSolution(currentItem.path)}`;
        feedbackElement.className = "incorrect";
        incorrectCount++;
        updateUserResultStats(false);
        currentItem.streak = 0;
        currentItem.priority += 2;
        if (streakMessageElement) {
            streakMessageElement.textContent = "Noch ein Versuch – du schaffst es!";
        }
    }

    saveProgress();
    updateStats();

    if (currentMode === "testing" && pendingItems.length === 0 && currentItem.learned === false) {
        setTimeout(() => {
            showFinalResults();
        }, 800);
        return;
    }

    setTimeout(() => {
        feedbackElement.textContent = "";
        feedbackElement.className = "";
        if (streakMessageElement) {
            streakMessageElement.textContent = "";
        }
        loadNextImage();
    }, 800);
}

function showFinalResults() {
    isSessionActive = false;
    gameArea.innerHTML = `
        <div class="results-card">
            <h2>Fertig!</h2>
            <p>Dein Ergebnis für diesen Durchgang:</p>
            <div class="result-row"><span>Fragen gesamt:</span><strong>${totalCount}</strong></div>
            <div class="result-row"><span>Richtig:</span><strong>${correctCount}</strong></div>
            <div class="result-row"><span>Falsch:</span><strong>${incorrectCount}</strong></div>
            <div class="result-row"><span>Note:</span><strong>${calculateGrade()}</strong></div>
            <div class="results-actions">
                <button id="repeat-button" type="button">Wiederholen</button>
                <button id="new-round-button" class="btn-secondary" type="button">Neuen Durchgang starten</button>
            </div>
        </div>
    `;
    document.getElementById("repeat-button").addEventListener("click", () => startNewSession());
    document.getElementById("new-round-button").addEventListener("click", () => startNewSession());
    feedbackElement = null;
    streakMessageElement = null;
    inputField = null;
    answerForm = null;
    playButton = null;
}

function selectCategory() {
    currentCategory = categorySelect.value;
    startNewSession();
}

function changeMode(event) {
    currentMode = event.target.value;
    startNewSession();
}

function handleUsernameChange() {
    const trimmedUsername = usernameInput.value.trim();
    localStorage.setItem("vokabeltrainer-last-username", trimmedUsername);

    if (!trimmedUsername) {
        return;
    }

    startNewSession();
}

function startNewSession() {
    currentRunSessionCounted = false;
    currentItem = null;
    correctCount = 0;
    incorrectCount = 0;
    totalCount = 0;
    isBlocked = false;
    isSessionActive = true;
    imageItems = buildImageItems(currentCategory);
    // Build a session queue with all items that are not yet learned.
    const pool = imageItems.filter((item) => !item.learned);
    pendingItems = buildPendingItems(pool);
    lastShownPath = null;

    updateStats();
    renderGameArea();
    bindGameElements();
    updateModeControls();
    loadNextImage();
}

function resetTrainer() {
    const shouldClearAll = confirm(`Sollen wirklich alle gespeicherten Nutzer- und Ergebnisdaten gelöscht werden?`);

    if (shouldClearAll) {
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && (key.startsWith("vokabeltrainer-progress-") || key.startsWith("vokabeltrainer-results-"))) {
                localStorage.removeItem(key);
            }
        }
        localStorage.removeItem("vokabeltrainer-last-username");
        usernameInput.value = "";

        if (userResultsSection) {
            userResultsSection.innerHTML = "<p>Keine gespeicherten Nutzer vorhanden.</p>";
            userResultsSection.style.display = "block";
        }
    }

    startNewSession();
}

function getStoredUsernames() {
    const usernames = new Set();
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith("vokabeltrainer-progress-")) {
            usernames.add(key.replace("vokabeltrainer-progress-", ""));
        }
        if (key && key.startsWith("vokabeltrainer-results-")) {
            usernames.add(key.replace("vokabeltrainer-results-", ""));
        }
    }
    return [...usernames].sort();
}

function renderUserResults() {
    const usernames = getStoredUsernames();
    if (!usernames.length) {
        userResultsSection.innerHTML = "<p>Keine gespeicherten Nutzer vorhanden.</p>";
        userResultsSection.style.display = "block";
        return;
    }

    userResultsSection.innerHTML = `
        <h3>Gespeicherte Ergebnisse</h3>
        <div class="user-results-list">
            ${usernames.map((username) => {
                const results = loadUserResults(username);
                const totalAnswers = results.correct + results.incorrect;
                const successRate = totalAnswers ? Math.round((results.correct / totalAnswers) * 100) : 0;
                return `
                    <div class="user-results-item">
                        <strong>${username}</strong>
                        <div class="user-results-actions">
                            <button type="button" class="btn-secondary" data-user="${username}" data-action="view">Anzeigen</button>
                            <button type="button" class="btn-secondary" data-user="${username}" data-action="reset">Zurücksetzen</button>
                        </div>
                        <div style="width: 100%; color: #4b5563; font-size: 14px;">
                            Richtig: ${results.correct} · Falsch: ${results.incorrect} · Gesamt: ${totalAnswers} · Trefferquote: ${successRate}% · Sitzungen: ${results.sessions || 0}
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
    userResultsSection.style.display = "block";

    userResultsSection.querySelectorAll("button[data-action='view']").forEach((button) => {
        button.addEventListener("click", () => {
            const selectedUsername = button.getAttribute("data-user");
            const results = loadUserResults(selectedUsername);
            const totalAnswers = results.correct + results.incorrect;
            const successRate = totalAnswers ? Math.round((results.correct / totalAnswers) * 100) : 0;
            const detailText = [
                `Benutzer: ${selectedUsername}`,
                `Richtig: ${results.correct}`,
                `Falsch: ${results.incorrect}`,
                `Gesamt: ${totalAnswers}`,
                `Trefferquote: ${successRate}%`,
                `Sitzungen: ${results.sessions || 0}`,
                `Zuletzt aktualisiert: ${results.lastUpdated ? new Date(results.lastUpdated).toLocaleString("de-DE") : "Noch keine Ergebnisse"}`
            ].join("\n");
            alert(detailText);
        });
    });

    userResultsSection.querySelectorAll("button[data-action='reset']").forEach((button) => {
        button.addEventListener("click", () => {
            const selectedUsername = button.getAttribute("data-user");
            if (confirm(`Ergebnisse von ${selectedUsername} wirklich zurücksetzen?`)) {
                localStorage.removeItem(getResultsStorageKey(selectedUsername));
                renderUserResults();
            }
        });
    });
}

function toggleUserResults() {
    if (userResultsSection.style.display === "block") {
        userResultsSection.style.display = "none";
        return;
    }
    renderUserResults();
}

function clearCurrentUserResults() {
    const username = (usernameInput?.value || "").trim().toLowerCase() || "guest";
    if (!username) {
        return;
    }

    if (!confirm(`Ergebnisse von ${username} wirklich löschen?`)) {
        return;
    }

    localStorage.removeItem(getResultsStorageKey(username));
    localStorage.removeItem(getStorageKey());
    if (userResultsSection && userResultsSection.style.display === "block") {
        renderUserResults();
    }
}

function bindControls() {
    categorySelect = document.getElementById("category-select");
    if (categorySelect) {
        // Populate options dynamically from CATEGORIES
        categorySelect.innerHTML = '';
        const optAll = document.createElement('option');
        optAll.value = 'all';
        optAll.textContent = 'Alle Kategorien';
        categorySelect.appendChild(optAll);

        if (typeof CATEGORIES !== 'undefined' && CATEGORIES) {
            Object.keys(CATEGORIES).sort().forEach((key) => {
                const entries = CATEGORIES[key];
                if (!entries || !entries.length) return;
                // derive display label from folder name in the first path: pics/<folder>/file
                const parts = entries[0].split('/');
                const folder = parts[1] || key;
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = folder;
                categorySelect.appendChild(opt);
            });
        }

        categorySelect.value = currentCategory || 'all';
        categorySelect.addEventListener("change", selectCategory);
    }

    usernameInput = document.getElementById("username-input");
    usernameInput.value = localStorage.getItem("vokabeltrainer-last-username") || "";
    usernameInput.addEventListener("change", handleUsernameChange);
    usernameInput.addEventListener("blur", handleUsernameChange);

    modeInputs = document.querySelectorAll('input[name="mode"]');
    modeInputs.forEach((input) => input.addEventListener("change", changeMode));

    finishButton = document.getElementById("finish-button");
    finishButton.addEventListener("click", () => {
        if (!isSessionActive) {
            return;
        }
        showFinalResults();
    });

    document.getElementById("reset-button").addEventListener("click", resetTrainer);
    showResultsButton = document.getElementById("show-results-button");
    showResultsButton.addEventListener("click", toggleUserResults);
    clearResultsButton = document.getElementById("clear-results-button");
    clearResultsButton.addEventListener("click", clearCurrentUserResults);
    userResultsSection = document.getElementById("user-results-section");
    gameArea = document.getElementById("game-area");
    counterCorrectElement = document.getElementById("counter-correct");
    counterIncorrectElement = document.getElementById("counter-incorrect");
    counterTotalElement = document.getElementById("counter-total");
    currentGradeElement = document.getElementById("current-grade");
}

document.addEventListener("DOMContentLoaded", () => {
    bindControls();
    startNewSession();
});
