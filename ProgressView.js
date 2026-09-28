/**
 * ProgressView — subject progress bars, weak-topic call-outs, and a
 * study-time-per-subject breakdown. This is the screen that visibly
 * connects quiz performance with study activity.
 */
export function renderProgress(container, { student, progressService }) {
  const progress = progressService.subjectProgress(student.id);
  const weakTopics = progressService.weakTopics(student.id);

  container.innerHTML = `
    <h2>Progress</h2>

    <section class="grid grid--2">
      ${progress.map(({ subject, record }) => `
        <div class="card">
          <h3><span class="subject-row__dot" style="background:${subject.color}"></span> ${subject.name}</h3>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${record.averageScore}%;background:${subject.color}"></div></div>
          <p class="muted small">${record.averageScore}% average · ${record.attemptCount} quiz attempt${record.attemptCount === 1 ? "" : "s"} · ${record.studyMinutes} min studied</p>
        </div>
      `).join("")}
    </section>

    <section class="card">
      <h3>Topics that need review</h3>
      ${weakTopics.length === 0 ? `<p class="muted">No weak topics flagged yet — keep taking quizzes to populate this.</p>` : `
        <ul class="weak-topic-list">
          ${weakTopics.map(({ subject, topic }) => `
            <li><span class="subject-row__dot" style="background:${subject.color}"></span> ${topic?.name ?? "Unknown topic"} <span class="muted small">(${subject.name})</span></li>
          `).join("")}
        </ul>
      `}
    </section>
  `;
}
