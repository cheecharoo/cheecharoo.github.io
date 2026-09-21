import { STRINGS } from "../lang/messages/en/user.js";

// AI assistance disclosure: Copilot was used to help some of the styling, but the logic and structure of the page was written by me. The code was then reviewed and modified to ensure it met the requirements of the assignment and my own coding standards.
const STORAGE_KEY = "comp4537-lab2-notes";
const REFRESH_INTERVAL = 2000;

class Note {
	constructor(text, onChange, onRemove, readOnly = false) {
		this.text = text;
		this.onChange = onChange;
		this.onRemove = onRemove;
		this.element = document.createElement("div");
		this.element.className = "note";
		this.createControls(readOnly);
	}

	createControls(readOnly) {
		this.textarea = document.createElement("textarea");
		this.textarea.value = this.text;
		this.textarea.readOnly = readOnly;
		this.textarea.setAttribute("aria-label", STRINGS.writerTitle);
		this.element.append(this.textarea);

		if (!readOnly) {
			this.removeButton = document.createElement("button");
			this.removeButton.type = "button";
			this.removeButton.className = "remove-button";
			this.removeButton.textContent = STRINGS.removeNote;
			this.removeButton.addEventListener("click", () => this.onRemove(this));
			this.textarea.addEventListener("input", () => {
				this.text = this.textarea.value;
				this.onChange();
			});
			this.element.append(this.removeButton);
		}
	}

	toObject() {
		return { text: this.textarea.value };
	}
}

class NotesStore {
	load() {
		const savedNotes = localStorage.getItem(STORAGE_KEY);
		if (!savedNotes) {
			return [];
		}

		try {
			const notes = JSON.parse(savedNotes);
			return Array.isArray(notes) ? notes : [];
		} catch {
			return [];
		}
	}

	save(notes) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.map((note) => note.toObject())));
	}
}

class WriterApp {
	constructor() {
		this.store = new NotesStore();
		this.notesContainer = document.getElementById("notes");
		this.savedTime = document.getElementById("savedTime");
		this.notes = [];
		this.hasUnsavedChanges = false;
		document.getElementById("writerTitle").textContent = STRINGS.writerTitle;
		document.getElementById("addButton").textContent = STRINGS.addNote;
		document.getElementById("writerBack").textContent = STRINGS.back;
		document.getElementById("addButton").addEventListener("click", () => this.addNote(""));
	}

	start() {
		const savedNotes = this.store.load();
		(savedNotes.length ? savedNotes : [{ text: "" }]).forEach((note) => this.addNote(note.text));
		setInterval(() => this.saveIfNeeded(), REFRESH_INTERVAL);
	}

	addNote(text) {
		const note = new Note(text, () => this.markAsChanged(), (removedNote) => this.removeNote(removedNote));
		this.notes.push(note);
		this.notesContainer.append(note.element);
	}

	markAsChanged() {
		this.hasUnsavedChanges = true;
	}

	removeNote(note) {
		note.element.remove();
		this.notes = this.notes.filter((currentNote) => currentNote !== note);
		this.save();
	}

	saveIfNeeded() {
		if (this.hasUnsavedChanges) {
			this.save();
		}
	}

	save() {
		this.store.save(this.notes);
		this.hasUnsavedChanges = false;
		this.savedTime.textContent = STRINGS.savedAt + new Date().toLocaleTimeString();
	}
}

class ReaderApp {
	constructor() {
		this.store = new NotesStore();
		this.notesContainer = document.getElementById("readNotes");
		this.retrievedTime = document.getElementById("retrievedTime");
		document.getElementById("readerTitle").textContent = STRINGS.readerTitle;
		document.getElementById("readerBack").textContent = STRINGS.back;
	}

	start() {
		this.retrieve();
		setInterval(() => this.retrieve(), REFRESH_INTERVAL);
		window.addEventListener("storage", (event) => {
			if (event.key === STORAGE_KEY) {
				this.retrieve();
			}
		});
	}

	retrieve() {
		this.notesContainer.replaceChildren();
		const savedNotes = this.store.load();
		savedNotes.forEach((note) => {
			const displayedNote = new Note(note.text, () => {}, () => {}, true);
			this.notesContainer.append(displayedNote.element);
		});
		if (!savedNotes.length) {
			const emptyMessage = document.createElement("p");
			emptyMessage.textContent = STRINGS.emptyNotes;
			this.notesContainer.append(emptyMessage);
		}
		this.retrievedTime.textContent = STRINGS.retrievedAt + new Date().toLocaleTimeString();
	}
}

function startPage() {
	const page = document.body.dataset.page;

	if (page === "index") {
		document.getElementById("title").textContent = STRINGS.indexTitle;
		document.getElementById("name").textContent = STRINGS.studentName;
		document.getElementById("writeButton").textContent = STRINGS.writeLabel;
		document.getElementById("readButton").textContent = STRINGS.readLabel;
	} else if (page === "writer") {
		new WriterApp().start();
	} else if (page === "reader") {
		new ReaderApp().start();
	}
}

startPage();