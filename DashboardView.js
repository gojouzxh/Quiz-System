/**
 * DashboardView — Week 2 landing screen.
 * Shows the 50% progress indicator required by the rubric, plus a quick
 * summary of streak/goals/subjects so the connection between quiz work
 * and study activity is visible from the first screen.
 */
const WEEK2_CHECKLIST = [
  "Core OOP classes implemented",
  "Quiz system working",
  "Study tracker working",
  "Database persistence working",
  "Main use cases working",
  "Basic unit tests implemented",
];

export function renderDashboard(container, { student, progressService, studyTrackerService }) {
  const currentStudent = student || { id: "student_demo", name: "Student", currentStreak: 0, longestStreak: 0 };
  const totals = studyTrackerService ? studyTrackerService.totalsFor(currentStudent.id) : { today: 0, week: 0, month: 0 };
  const progress = progressService ? progressService.subjectProgress(currentStudent.id) : [];
  const goalProgress = studyTrackerService ? studyTrackerService.goalProgress(currentStudent.id) : [];

  const streak = currentStudent.currentStreak || 0;
  const todayMin = totals.today || 0;
  const weekMin = totals.week || 0;

  container.innerHTML = `
    <section class="status-panel card">
      <div class="status-panel__head">
        <div>
          <h2 style="margin-bottom:4px">Project Progress: 50%</h2>
          <p class="muted small" style="margin:0">Week 2 — Core Implementation</p>
        </div>
        <span class="badge badge--week">Week 2</span>
      </div>
      <div class="progress-bar" style="margin:12px 0">
        <div class="progress-bar__fill" style="width:50%"></div>
      </div>
      <ul class="checklist">
        ${WEEK2_CHECKLIST.map((item) => `<li class="checklist__item">${item}</li>`).join("")}
      </ul>
    </section>

    <section class="grid grid--3">
      <div class="card stat-card">
        <span class="stat-card__label">Current streak</span>
        <span class="stat-card__value">${streak} ${streak === 1 ? "day" : "days"}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-card__label">Studied today</span>
        <span class="stat-card__value">${todayMin} min</span>
      </div>
      <div class="card stat-card">
        <span class="stat-card__label">Studied this week</span>
        <span class="stat-card__value">${weekMin} min</span>
      </div>
    </section>

    <div class="grid grid--2">
      <section class="card">
        <h3>Subjects at a glance</h3>
        <div class="subject-list">
          ${progress.length === 0 ? `<p class="muted small">No subjects available.</p>` : progress.map(({ subject, record }) => `
            <div class="subject-row">
              <span class="subject-row__dot" style="background:${subject.color}"></span>
              <span class="subject-row__name">${subject.name}</span>
              <div class="progress-bar progress-bar--sm">
                <div class="progress-bar__fill" style="width:${record.averageScore}%;background:${subject.color}"></div>
              </div>
              <span class="subject-row__meta">${record.averageScore}% avg · ${record.attemptCount} quiz${record.attemptCount === 1 ? "" : "zes"}</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="card">
        <h3>Study goals</h3>
        ${goalProgress.length === 0
          ? `<p class="muted small">No goals yet — <a href="#/study">create one</a>.</p>`
          : goalProgress.slice(0, 3).map(({ goal, actualMinutes, percentage, met }) => {
              const title = goal.title || "Study Goal";
              const status = goal.status || "active";
              const targetHours = Number(goal.targetHours) || (goal.targetMinutes ? goal.targetMinutes / 60 : 1);
              const hrs = (Number(actualMinutes || 0) / 60).toFixed(1);
              return `
                <div class="goal-row" style="margin-bottom:12px">
                  <div class="goal-row__header">
                    <span class="goal-row__title">${title}</span>
                    <span class="badge badge--status badge--${status}">${status}</span>
                  </div>
                  <div class="progress-bar progress-bar--sm">
                    <div class="progress-bar__fill" style="width:${percentage || 0}%"></div>
                  </div>
                  <span class="muted small">${hrs}h / ${targetHours}h ${met ? "✓" : ""}</span>
                </div>
              `;
            }).join("")}
        <a href="#/study" class="link-btn" style="font-size:0.85rem">Manage goals →</a>
      </section>
    </div>

    <nav class="quick-nav">
      <a href="#/quizzes" class="btn btn--primary">Browse quizzes</a>
      <a href="#/study" class="btn">Log a study session</a>
      <a href="#/progress" class="btn">View progress</a>
      <a href="#/history" class="btn">Quiz history</a>
    </nav>
  `;
}
