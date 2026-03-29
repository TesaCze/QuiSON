# QuiSON – SCIO Test Trainer

A clean Angular 17 app for studying SCIO tests. Import JSON question sets, run timed quizzes, review results, and track your history.

## Tech stack

- **Angular 17** (standalone components, signals)
- **Tailwind CSS v3**
- **TypeScript**

---

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

---

## Project structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   └── quiz.model.ts          # All interfaces/types
│   │   └── services/
│   │       ├── quiz-state.service.ts  # Central state (signals)
│   │       └── timer.service.ts       # Countdown timer
│   ├── shared/
│   │   ├── components/
│   │   │   ├── header.component.ts
│   │   │   ├── modal.component.ts
│   │   │   └── empty.component.ts
│   │   └── pipes/
│   │       └── format-time.pipe.ts
│   ├── features/
│   │   ├── home/
│   │   │   └── home.component.ts      # Landing + import
│   │   ├── builder/
│   │   │   └── builder.component.ts   # Question editor
│   │   ├── quiz/
│   │   │   ├── quiz.component.ts      # Active quiz
│   │   │   └── start-modal.component.ts
│   │   ├── results/
│   │   │   └── results.component.ts   # Score + answer review
│   │   └── history/
│   │       └── history.component.ts   # Past quiz log
│   ├── app.component.ts               # Root shell + view router
│   └── app.config.ts
├── styles.css                         # Tailwind + global component classes
└── index.html
```

---

## JSON question format

```json
[
  {
    "id": 1,
    "question": "Text otázky?",
    "options": {
      "A": "Možnost A",
      "B": "Možnost B",
      "C": "Možnost C",
      "D": "Možnost D"
    },
    "correct": "A"
  }
]
```

---

## Features

- **Import JSON** – drag & drop or file picker
- **Builder** – create questions manually, export to JSON
- **Timed quiz** – optional countdown with warn/danger states
- **Instant feedback** – correct/wrong revealed after each answer
- **Skip** – skip questions (marked in results)
- **Results** – score %, filter by correct/wrong/skipped
- **History** – localStorage-persisted, click any entry for full review

---

## Build for production

```bash
npm run build
```

Output goes to `dist/quison/`.
