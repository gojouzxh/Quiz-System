/**
 * ProgressService — owns academic performance, subject progress, weak
 * topics, and study analytics. Reads from QuizService + StudyTrackerService
 * but writes nothing of its own except derived ProgressRecords —
 * this is the "connect quiz performance and study activity" seam the
 * spec calls for.
 */
import { ProgressRecord } from "../models/ProgressRecord.js";

const WEAK_TOPIC_THRESHOLD = 70; // percentage below which a topic is flagged for review

export class ProgressService {
  #quizService; #studyTrackerService;

  constructor({ quizService, studyTrackerService }) {
    this.#quizService = quizService;
    this.#studyTrackerService = studyTrackerService;
  }

  subjectProgress(studentId) {
    const attempts = this.#quizService.listAttempts(studentId);
    const sessions = this.#studyTrackerService.listSessions(studentId);

    return this.#quizService.listSubjects().map((subject) => {
      const subjectAttempts = attempts.filter((a) => a.subjectId === subject.id);
      const averageScore = subjectAttempts.length
        ? Math.round(subjectAttempts.reduce((sum, a) => sum + a.percentage, 0) / subjectAttempts.length)
        : 0;
      const studyMinutes = sessions.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.minutes, 0);
      const weakTopicIds = this.#weakTopicsFor(subject.id, subjectAttempts);

      return { subject, record: new ProgressRecord({ subjectId: subject.id, averageScore, attemptCount: subjectAttempts.length, studyMinutes, weakTopicIds }) };
    });
  }

  #weakTopicsFor(subjectId, subjectAttempts) {
    const byTopic = new Map();
    subjectAttempts.forEach((a) => {
      if (!byTopic.has(a.topicId)) byTopic.set(a.topicId, []);
      byTopic.get(a.topicId).push(a.percentage);
    });
    const weak = [];
    byTopic.forEach((scores, topicId) => {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      if (avg < WEAK_TOPIC_THRESHOLD) weak.push(topicId);
    });
    return weak;
  }

  weakTopics(studentId) {
    return this.subjectProgress(studentId).flatMap(({ subject, record }) =>
      record.weakTopicIds.map((topicId) => ({
        subject,
        topic: this.#quizService.getTopic(topicId),
      }))
    );
  }
}
