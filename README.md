# Quiz & Study Tracker

A student learning platform combining a **Quiz System** and a **Study Tracker**, so a
student can practice, log study time, and see how the two connect (weak topics,
subject progress, streaks).

This repository currently represents the **Week 1 — 25% milestone**: design,
domain model, service boundaries, and a runnable skeleton with basic working
features for every planned screen.

## Problem

Students need a centralized platform where they can practice quizzes, monitor
their study habits, track their progress, and identify topics that require
additional review.

## Tech stack

| Layer      | Choice                                   | Why |
|------------|-------------------------------------------|-----|
| UI         | Vanilla HTML / CSS / JavaScript (ES modules) | No build step needed to demo a skeleton; keeps the focus on architecture, not tooling. |
| Routing    | Small hand-written hash router (`js/router.js`) | Enough for client-side navigation between screens without adding a framework dependency. |
| Persistence | `localStorage`, behind a `Repository` interface (`js/data/Database.js`) | Stands in for a real database this week. Because everything goes through the `Repository` contract, swapping in a real backend later means adding one new repository class — services never touch `localStorage` directly. |
| Styling    | Plain CSS, Source Serif 4 + Inter (Google Fonts) | No framework needed for this scope. |

**Note on running it:** because `index.html` loads JavaScript as ES modules
(`<script type="module">`), open it through a local server rather than
double-clicking the file. Chrome blocks module imports over `file://` as a
browser security rule, so direct file opening leaves the app unable to boot.

On Windows, run this repository's launcher from PowerShell:

```powershell
.\start-server.ps1
```

It starts a self-contained PowerShell server and opens the app at
`http://127.0.0.1:8000/` (or the next free port if 8000 is busy). It does not
require Python, Node, or a build step. You can also double-click
`start-server.cmd` in Windows Explorer.

In VS Code, press `F5` and choose **Launch Quiz Study Platform**. VS Code now
starts the server automatically and opens Chrome at `http://127.0.0.1:8080/`.

or `npx serve .` if you have Node installed.

On first load the app seeds itself with a demo student ("Mark") and sample
Subjects/Topics/Quizzes across Programming, Databases, and HCI — enough data
to exercise every screen immediately.

## Project structure

```
quiz-study-platform/
├── index.html              # App shell: sidebar nav + <main> mount point
├── css/
│   └── styles.css          # All styling (design tokens at the top)
├── js/
│   ├── app.js               # Bootstraps repositories, services, router
│   ├── router.js            # Tiny hash-based router
│   ├── models/               # Domain model (see below)
│   ├── data/
│   │   ├── Database.js       # Repository interface + LocalStorageRepository
│   │   └── seed.js           # Demo data seeding
│   ├── services/             # Service layer (see Service Boundaries)
│   └── views/                 # Render functions for each screen
├── README.md
└── PROJECT_PLAN.md          # Four-week development plan
```

## Service boundaries

Each service owns one area of responsibility and its own data; nothing
reaches into another service's repositories directly.

- **UserService** — student accounts, profile, streak bookkeeping.
- **QuizService** — subjects, topics, quizzes, questions, choices, quiz
  attempts and results.
- **StudyTrackerService** — study sessions, study goals, duration totals.
- **ProgressService** — reads from `QuizService` + `StudyTrackerService` to
  produce subject progress and weak-topic analytics. Owns nothing of its
  own except the derived `ProgressRecord` snapshots — this is the seam
  where quiz performance and study activity connect.

## OOP domain model

`js/models/` — one class per concept, each with encapsulated private state
(`#field`) and behavior, not just data bags:

- `User` (abstract base) → `Student` (**inheritance**: shared identity/auth
  in `User`, academic profile + streak logic in `Student`)
- `Subject` → `Topic` → `Quiz` → `Question` → `Choice` (**composition**: a
  `Quiz` owns its `Question`s, a `Question` owns its `Choice`s)
- `QuizAttempt` → `QuizAnswer` (**composition**: an attempt owns its answers;
  `Quiz.grade()` is the single place scoring math happens)
- `StudySession`, `StudyGoal` (goal owns its own progress-percentage math)
- `ProgressRecord` — a read-only derived snapshot produced by `ProgressService`

**Abstraction / interfaces:** `Repository` (in `Database.js`) defines the
contract every data store must satisfy; `LocalStorageRepository` is the one
concrete implementation this week. Services depend on the `Repository`
shape, not on `localStorage` — a **Dependency Inversion** boundary that lets
a real backend swap in later without touching service code.

## Features implemented this milestone

- Browse Subjects → Topics → Quizzes
- Take a quiz, submit, get an automatic score
- Review incorrect answers with explanations
- Quiz history (all past attempts, newest first)
- Log study sessions (subject, minutes, notes)
- Daily / weekly / monthly study totals
- Study streaks (current + longest)
- Study goals (daily/weekly/monthly) with progress bars
- Subject progress (average quiz score + study minutes)
- Weak-topic detection (topics averaging below 70%)
- Dashboard with the Week 1 project-status checklist

## Week 1 status

- [x] Problem defined
- [x] Service boundary defined
- [x] OOP/domain model created
- [x] Technology stack selected
- [x] Runnable skeleton created
- [x] Development plan created

See `PROJECT_PLAN.md` for the full four-week plan.
