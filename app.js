import { LocalStorageRepository, makeId } from "./data/Database.js";
import { seedIfEmpty } from "./data/seed.js";
import { Student } from "./models/Student.js";
import { Subject } from "./models/Subject.js";
import { Topic } from "./models/Topic.js";
import { Quiz } from "./models/Quiz.js";
import { QuizAttempt } from "./models/QuizAttempt.js";
import { StudySession } from "./models/StudySession.js";
import { StudyGoal } from "./models/StudyGoal.js";

import { UserService } from "./services/UserService.js";
import { QuizService } from "./services/QuizService.js";
import { StudyTrackerService } from "./services/StudyTrackerService.js";
import { ProgressService } from "./services/ProgressService.js";

import { Router } from "./router.js";
import { renderDashboard } from "./views/DashboardView.js";
import { renderQuizList } from "./views/QuizListView.js";
import { renderQuizTaking } from "./views/QuizTakingView.js";
import { renderQuizResult } from "./views/QuizResultView.js";
import { renderQuizHistory } from "./views/QuizHistoryView.js";
import { renderStudyTracker } from "./views/StudyTrackerView.js";
import { renderProgress } from "./views/ProgressView.js";

// ---- Repositories (Database layer: one per collection) ----
const repos = {
  students: new LocalStorageRepository("students", Student.fromJSON),
  subjects: new LocalStorageRepository("subjects", Subject.fromJSON),
  topics: new LocalStorageRepository("topics", Topic.fromJSON),
  quizzes: new LocalStorageRepository("quizzes", Quiz.fromJSON),
  attempts: new LocalStorageRepository("attempts", QuizAttempt.fromJSON),
  sessions: new LocalStorageRepository("sessions", StudySession.fromJSON),
  goals: new LocalStorageRepository("goals", StudyGoal.fromJSON),
};

seedIfEmpty({
  subjects: repos.subjects,
  topics: repos.topics,
  quizzes: repos.quizzes,
  students: repos.students,
  sessions: repos.sessions,
  goals: repos.goals,
});

// ---- Services (Service boundaries) ----
const userService = new UserService({ students: repos.students });
const quizService = new QuizService({ subjects: repos.subjects, topics: repos.topics, quizzes: repos.quizzes, attempts: repos.attempts });
const studyTrackerService = new StudyTrackerService({ sessions: repos.sessions, goals: repos.goals, userService });
const progressService = new ProgressService({ quizService, studyTrackerService });

const services = { userService, quizService, studyTrackerService, progressService };

// ---- App shell ----
const mainEl = document.getElementById("app-main");
const navLinks = document.querySelectorAll("[data-nav-link]");

function setActiveNav(hash) {
  navLinks.forEach((link) => link.classList.toggle("nav-link--active", link.getAttribute("href") === hash));
}

const router = new Router();

router.add("/dashboard", () => {
  setActiveNav("#/dashboard");
  renderDashboard(mainEl, { student: userService.currentStudent(), progressService, studyTrackerService });
});

router.add("/quizzes", () => {
  setActiveNav("#/quizzes");
  renderQuizList(mainEl, { quizService, navigate: (h) => router.navigate(h) });
});

router.add("/quiz/:id", ({ id }) => {
  setActiveNav("#/quizzes");
  const quiz = quizService.getQuiz(id);
  if (!quiz) return router.navigate("#/quizzes");
  renderQuizTaking(mainEl, { quiz, quizService, student: userService.currentStudent(), navigate: (h) => router.navigate(h) });
});

router.add("/quiz-result/:attemptId", ({ attemptId }) => {
  setActiveNav("#/history");
  const attempt = quizService.getAttempt(attemptId);
  if (!attempt) return router.navigate("#/history");
  const quiz = quizService.getQuiz(attempt.quizId);
  renderQuizResult(mainEl, { attempt, quiz, navigate: (h) => router.navigate(h) });
});

router.add("/history", () => {
  setActiveNav("#/history");
  renderQuizHistory(mainEl, { student: userService.currentStudent(), quizService, navigate: (h) => router.navigate(h) });
});

router.add("/study", () => {
  setActiveNav("#/study");
  renderStudyTracker(mainEl, {
    student: userService.currentStudent(), quizService, studyTrackerService,
    rerender: () => router.navigate("#/study"),
  });
});

router.add("/progress", () => {
  setActiveNav("#/progress");
  renderProgress(mainEl, { student: userService.currentStudent(), progressService });
});

router.notFound(() => router.navigate("#/dashboard"));

router.start();

// Expose services for debugging in the browser console during development.
window.__qsp = { repos, services, makeId };
