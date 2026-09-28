# Project Plan — Quiz & Study Tracker

Four-week development flow. Each week builds on the previous one; nothing
in an earlier week is thrown away, only extended.

## Week 1 — 25%: Design and Skeleton ✅ (this delivery)

**Goal:** a clearly defined problem, service boundaries, OOP/domain model,
technology stack, project structure, and a runnable skeleton.

- [x] Problem definition
- [x] Service boundaries (User, Quiz, Study Tracker, Progress)
- [x] OOP domain model (`User`/`Student`, `Subject`, `Topic`, `Quiz`,
      `Question`, `Choice`, `QuizAttempt`, `QuizAnswer`, `StudySession`,
      `StudyGoal`, `ProgressRecord`)
- [x] Technology stack selected (vanilla HTML/CSS/JS, hash router,
      `localStorage` behind a `Repository` interface)
- [x] Runnable skeleton: builds/runs via a static file server, has basic
      routing/navigation, and an initial data structure (seeded demo data)
- [x] README + this project plan

## Week 2 — 50%: Core Quiz System

- Expand quiz content (more subjects/topics/quizzes/questions)
- Question types beyond single-answer multiple choice, if time allows
  (e.g. true/false as a specialization)
- Input validation and error states (e.g. submitting with unanswered
  questions, empty question banks)
- Quiz history pagination/filtering by subject
- Basic unit tests for `Quiz.grade()` and grading edge cases
- Replace the demo single-student assumption with a lightweight
  login/session flow through `UserService`

## Week 3 — 75%: Core Study Tracker + Progress Integration

- Study session editing/deletion
- Calendar-style view of study activity (daily heatmap)
- Refine weak-topic detection (configurable threshold, minimum attempt
  count before flagging)
- Subject-level trend over time (is the average improving?)
- Persist goals across periods without overwriting history
- Cross-link: from a weak topic straight into a relevant quiz

## Week 4 — 100%: Polish, Testing, and Delivery

- Full responsive/accessibility pass (keyboard navigation, focus states,
  color contrast)
- Empty/loading/error states for every view
- End-to-end walkthrough test (seed → take quiz → log study → check
  progress) documented in README
- Data export (e.g. download quiz history / study log as CSV or JSON)
- Final documentation pass: architecture diagram, setup instructions,
  known limitations
- Optional: swap `LocalStorageRepository` for a real backend API,
  now trivial because services only depend on the `Repository` contract
