import { StudySession } from "../models/StudySession.js";
import { StudyGoal } from "../models/StudyGoal.js";
import { makeId } from "../data/Database.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * StudyTrackerService — owns StudySessions, StudyGoals, and the
 * duration/streak/period math derived from them. Depends on UserService
 * only through the one hook (recordStudyDay) it needs — not the whole
 * student repository — keeping the service boundary narrow.
 */
export class StudyTrackerService {
  #sessions; #goals; #userService;

  constructor({ sessions, goals, userService }) {
    this.#sessions = sessions;
    this.#goals = goals;
    this.#userService = userService;
  }

  /**
   * Log a study session.
   * Accepts either { minutes } or { startTime, endTime } — duration is calculated automatically.
   * @param {string} studentId
   * @param {{ subjectId, topicId?, startTime?, endTime?, minutes?, notes?, date? }} opts
   */
  logSession(studentId, { subjectId, topicId = null, startTime = null, endTime = null, minutes = null, notes = "", date }) {
    const resolvedDate = date || (startTime ? startTime : new Date().toISOString());
    const session = new StudySession({
      id: makeId("session"), studentId, subjectId, topicId,
      startTime, endTime, minutes, notes, date: resolvedDate,
    });
    this.#sessions.save(session);
    if (this.#userService?.recordStudyDay) {
      this.#userService.recordStudyDay(studentId, session.date);
    }
    // Update any active subject goals
    this.#updateGoalProgress(studentId, subjectId, session.minutes);
    return session;
  }

  listSessions(studentId) {
    return this.#sessions
      .query((s) => s && s.studentId === studentId)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  #minutesSince(studentId, since) {
    return this.listSessions(studentId)
      .filter((s) => new Date(s.date) >= since)
      .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
  }

  totalsFor(studentId) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * DAY_MS);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      today: this.#minutesSince(studentId, startOfToday),
      week: this.#minutesSince(studentId, startOfWeek),
      month: this.#minutesSince(studentId, startOfMonth),
    };
  }

  // ---- Study Goals ----

  /**
   * Create or replace a study goal.
   * @param {string} studentId
   * @param {{ title, subjectId?, targetHours, targetDate? }} opts
   */
  createGoal(studentId, { title, subjectId = null, targetHours, targetDate = null }) {
    const goal = new StudyGoal({ id: makeId("goal"), studentId, title, subjectId, targetHours, targetDate });
    this.#goals.save(goal);
    return goal;
  }

  /**
   * Backward-compatible alias for Week 1 callers who use period + targetMinutes.
   */
  setGoal(studentId, opts) {
    if (opts.title || opts.targetHours) {
      return this.createGoal(studentId, opts);
    }
    const title = `${opts.period ? opts.period.charAt(0).toUpperCase() + opts.period.slice(1) : "Weekly"} Study Goal`;
    const targetHours = opts.targetMinutes ? Math.max(0.5, opts.targetMinutes / 60) : 2;
    return this.createGoal(studentId, { title, targetHours });
  }

  goalsFor(studentId) {
    return this.#goals.query((g) => g && g.studentId === studentId);
  }

  goalProgress(studentId) {
    const sessions = this.listSessions(studentId);
    return this.goalsFor(studentId).map((goal) => {
      // Compute minutes logged relevant to the goal (subject-scoped if set)
      const relevant = goal.subjectId
        ? sessions.filter((s) => s.subjectId === goal.subjectId)
        : sessions;
      const actualMinutes = relevant.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
      return { goal, ...goal.progressToward(actualMinutes) };
    });
  }

  /** Auto-update goal currentHours when a session is logged. */
  #updateGoalProgress(studentId, subjectId, minutes) {
    try {
      const goals = this.goalsFor(studentId).filter((g) => {
        if (g.status === "met") return false;
        return !g.subjectId || g.subjectId === subjectId;
      });
      goals.forEach((goal) => {
        const updated = goal.addHours((Number(minutes) || 0) / 60);
        this.#goals.save(updated);
      });
    } catch (err) {
      console.warn("[StudyTrackerService] updateGoalProgress error:", err);
    }
  }

  deleteGoal(goalId) {
    this.#goals.delete(goalId);
  }
}
