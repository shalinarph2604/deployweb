// Select DOM elements
const loginForm = document.getElementById("login-form");
const wordleContainer = document.getElementById("wordle-container");
const gameBoard = document.getElementById("game-board");
const notification = document.getElementById("notification");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");

let token = null; // Store login token
let secretWord = ""; // The word to guess
let currentRow = 0; // Current row of the game grid
let currentInput = ""; // Current input from the user

// Periksa apakah token sudah ada di localStorage
const existingToken = localStorage.getItem("token");
if (existingToken) {
    console.log("Token found:", existingToken); // Debugging: Pastikan token ditemukan
    showNotification("Welcome back!", "success");
    loginForm.classList.add("hidden");
    wordleContainer.classList.remove("hidden");
    startGame(); // Langsung mulai game jika token ditemukan
} else {
    console.log("No token found, please log in."); // Debugging: Tidak ada token, user harus login
}

// Login functionality
loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Validasi input
    if (!username || !password) {
        showNotification("Please enter both username and password", "error");
        return;
    }

    try {
        // Mengirim request login ke server
        const response = await fetch("https://delta-indie.vercel.app/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        // Mengecek apakah request berhasil
        if (!response.ok) throw new Error("Invalid login credentials");

        // Mendapatkan token dari response API
        const data = await response.json();
        token = data.token;

        console.log("Token:", token); // Debugging line: Pastikan token diterima dengan benar

        // Simpan token ke localStorage agar user tidak perlu login lagi
        localStorage.setItem("token", token);

        // Menampilkan notifikasi login sukses
        showNotification("Login successful!", "success");

        // Menyembunyikan form login dan menampilkan game setelah 1 detik
        setTimeout(() => {
            loginForm.classList.add("hidden");
            wordleContainer.classList.remove("hidden");
            startGame(); // Mulai game setelah login sukses
        }, 1000);
    } catch (error) {
        showNotification("Login failed: " + error.message, "error");
    }
});


// Fetch random word and initialize the game board
async function startGame() {
    try {
        if (!token) throw new Error("Missing authorization token");

        const response = await fetch('https://delta-indie.vercel.app/api/random-word', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        secretWord = (await response.json()).word;
        console.log("Secret word:", secretWord);
        if (!secretWord) throw new Error("Failed to fetch word");

        
        initializeBoard(secretWord.length);
        enableInput();
    } catch (error) {
        console.error("Error starting game:", error); 
        showNotification("Error starting game: " + error.message, "error");
    }
}

// Create game board grid
function initializeBoard(wordLength) {
    console.log("Word length: ", wordLength); // Debugging line
    gameBoard.innerHTML = ""; // Clear previous game state

    for (let i = 0; i < 6; i++) {
        const row = document.createElement("div");
        row.classList.add("word-row");

        for (let j = 0; j < wordLength; j++) {
            const cell = document.createElement("div");
            cell.classList.add("word-cell");
            row.appendChild(cell);
        }

        gameBoard.appendChild(row);
    }

    showNotification(`Guess the ${wordLength}-letter word!`, "success");
}
// Handle user input
function enableInput() {
    document.addEventListener("keydown", handleKeyPress);
}

function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    const wordRow = document.querySelectorAll(".word-row")[currentRow];
    const cells = wordRow.querySelectorAll(".word-cell");

    if (key === "enter") {
        if (currentInput.length === secretWord.length) {
            checkWord();
        } else {
            showNotification("Not enough letters", "error");
        }
    } else if (key === "backspace") {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            cells[currentInput.length].textContent = "";
        }
    } else if (/^[a-z]$/.test(key) && currentInput.length < secretWord.length) {
        cells[currentInput.length].textContent = key.toUpperCase();
        currentInput += key;
    }
}

// Check if the user's input matches the secret word
function checkWord() {
    const wordRow = document.querySelectorAll(".word-row")[currentRow];
    const cells = wordRow.querySelectorAll(".word-cell");
    const guess = currentInput.toLowerCase();

    for (let i = 0; i < secretWord.length; i++) {
        if (guess[i] === secretWord[i]) {
            cells[i].classList.add("correct");
        } else if (secretWord.includes(guess[i])) {
            cells[i].classList.add("present");
        } else {
            cells[i].classList.add("absent");
        }
    }

    if (guess === secretWord) {
        showNotification("You guessed the word! 🎉", "success");
        document.removeEventListener("keydown", handleKeyPress);
    } else if (currentRow === 5) {
        showNotification(`Game over! The word was: ${secretWord}`, "error");
        document.removeEventListener("keydown", handleKeyPress);
    } else {
        currentRow++;
        currentInput = "";
    }
}

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
}

// Logout
function logout() {
    token = null;
    secretWord = "";
    currentRow = 0;
    currentInput = "";
    wordleContainer.classList.add("hidden");
    loginForm.classList.remove("hidden");
    showNotification("Logged out successfully!", "success");
}