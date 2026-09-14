import { STRINGS } from "../lang/messages/en/user.js";

// AI assistance disclosure: GitHub Copilot was used during development for commenting and logic validation.

// Represents one numbered button and stores its original order, color, and DOM element.
class GameSquare
{
    constructor(id, color)
    {
        this.id = id;
        this.color = color;
        this.isRevealed = true;
        this.element = null;
    }

    hide()
    {
        this.isRevealed = false;
        this.element.textContent = "";
    }

    reveal()
    {
        this.isRevealed = true;
        this.element.textContent = this.id + 1;
    }
}

// Owns the game board UI: it creates buttons, controls their enabled state, and moves them.
class GameBoard
{
    constructor(element)
    {
        this.element = element;
        this.buttonWidth = 10;
        this.buttonHeight = 5;
    }

    clear()
    {
        this.element.replaceChildren();
    }

    render(gameSquares, onSquareClick)
    {
        this.clear();

        for (const square of gameSquares)
        {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = square.id + 1;
            button.style.backgroundColor = square.color;
            button.style.width = `${this.buttonWidth}em`;
            button.style.height = `${this.buttonHeight}em`;
            button.addEventListener("click", () => onSquareClick(square));

            square.element = button;
            this.element.append(button);
        }

        this.setButtonsDisabled(true);
    }

    setButtonsDisabled(isDisabled)
    {
        for (const button of this.element.querySelectorAll("button"))
        {
            button.disabled = isDisabled;
        }
    }

    shuffle(gameSquares)
    {
        // Read the current viewport before every shuffle so each button stays visible.
        const boardBounds = this.element.getBoundingClientRect();
        const boardWidth = Math.min(this.element.clientWidth, window.innerWidth - boardBounds.left);
        const boardHeight = Math.min(this.element.clientHeight, window.innerHeight - boardBounds.top);

        for (const square of gameSquares)
        {
            const maximumLeft = Math.max(0, boardWidth - square.element.offsetWidth);
            const maximumTop = Math.max(0, boardHeight - square.element.offsetHeight);

            square.element.style.position = "absolute";
            square.element.style.left = `${Math.random() * maximumLeft}px`;
            square.element.style.top = `${Math.random() * maximumTop}px`;
        }
    }
}

// Controls the game phases: preview, timed scrambling, memory testing, and game over.
class Game
{
    constructor(numBoxes, board, showMessage)
    {
        this.numBoxes = numBoxes;
        this.board = board;
        this.showMessage = showMessage;
        this.gameSquares = [];
        this.nextId = 0;
        this.isActive = false;
        this.timers = [];
        this.shuffleCount = 0;
        this.shuffleDelay = 2000;
    }

    start()
    {
        // Starting again cancels the old game and creates a fresh set of buttons.
        this.stop();
        this.nextId = 0;
        this.shuffleCount = 0;
        this.gameSquares = this.createSquares();
        this.board.render(this.gameSquares, (square) => this.handleSquareClick(square));
        this.schedule(() => this.beginScrambling(), this.numBoxes * 1000);
    }

    stop()
    {
        for (const timer of this.timers)
        {
            clearTimeout(timer);
        }

        this.timers = [];
        this.isActive = false;
        this.board.setButtonsDisabled(true);
    }

    createSquares()
    {
        const squares = [];

        for (let id = 0; id < this.numBoxes; id++)
        {
            squares.push(new GameSquare(id, this.createRandomColor()));
        }

        return squares;
    }

    createRandomColor()
    {
        const letters = "0123456789ABCDEF";
        let color = "#";

        for (let index = 0; index < 6; index++)
        {
            color += letters[Math.floor(Math.random() * letters.length)];
        }

        return color;
    }

    beginScrambling()
    {
        this.hideNumbers();
        this.scrambleNext();
    }

    scrambleNext()
    {
        // The first move happens after the n-second preview; later moves are two seconds apart.
        this.board.shuffle(this.gameSquares);
        this.shuffleCount++;

        if (this.shuffleCount === this.numBoxes)
        {
            this.isActive = true;
            this.board.setButtonsDisabled(false);
            return;
        }

        this.schedule(() => this.scrambleNext(), this.shuffleDelay);
    }

    hideNumbers()
    {
        for (const square of this.gameSquares)
        {
            square.hide();
        }
    }

    handleSquareClick(square)
    {
        if (!this.isActive)
        {
            return;
        }

        if (square.id !== this.nextId)
        {
            // A mistake ends the game and reveals the complete correct order.
            this.revealCorrectOrder();
            this.stop();
            this.showMessage(STRINGS.WRONG_ORDER_MESSAGE);
            return;
        }

        square.reveal();
        this.nextId++;

        if (this.nextId === this.numBoxes)
        {
            // Every button was selected in its original order.
            this.stop();
            this.showMessage(STRINGS.EXCELLENT_MEMORY_MESSAGE);
        }
    }

    revealCorrectOrder()
    {
        for (const square of this.gameSquares)
        {
            square.reveal();
        }
    }

    schedule(action, delay)
    {
        const timer = setTimeout(action, delay);
        this.timers.push(timer);
    }
}

// Connects the form and messages to the game classes and starts each new game.
class AppController
{
    constructor()
    {
        this.title = document.getElementById("title");
        this.inputLabel = document.querySelector(".button-label");
        this.input = document.getElementById("num-boxes-input");
        this.startButton = document.getElementById("game-starter");
        this.message = document.getElementById("input-message");
        this.board = new GameBoard(document.querySelector(".game-board"));
        this.game = null;
    }

    initialize()
    {
        this.title.textContent = STRINGS.APP_TITLE;
        this.inputLabel.textContent = STRINGS.INPUT_BOX_LABEL;
        this.input.placeholder = STRINGS.INPUT_PLACEHOLDER;
        this.startButton.textContent = STRINGS.START_BUTTON_LABEL;
        this.startButton.addEventListener("click", () => this.startGame());
    }

    startGame()
    {
        const inputValue = this.input.value.trim();

        // Only whole numbers from 3 through 7 are valid game sizes.
        if (!/^([3-7])$/.test(inputValue))
        {
            this.message.textContent = STRINGS.INVALID_INPUT_MESSAGE;
            this.input.focus();
            return;
        }

        this.message.textContent = STRINGS.VALID_INPUT_MESSAGE;

        if (this.game !== null)
        {
            this.game.stop();
        }

        this.game = new Game(Number(inputValue), this.board, (message) => this.showMessage(message));
        this.game.start();
    }

    showMessage(message)
    {
        this.message.textContent = message;
    }
}

new AppController().initialize();