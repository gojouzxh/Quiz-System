import { QuizAttempt } from "../models/QuizAttempt.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { Subject } from "../models/Subject.js";
import { Topic } from "../models/Topic.js";
import { makeId } from "../data/Database.js";

/**
 * QuizService — owns Subjects, Topics, Quizzes, Questions, Choices,
 * QuizAttempts, and results. Grading math itself lives on Quiz.grade();
 * this service is the orchestrator: load quiz, grade it, persist the
 * attempt, hand back a result view-model.
 */
export class QuizService {
  #subjects; #topics; #quizzes; #attempts;

  constructor({ subjects, topics, quizzes, attempts }) {
    this.#subjects = subjects;
    this.#topics = topics;
    this.#quizzes = quizzes;
    this.#attempts = attempts;
  }

  // ---- Subject management ----

  listSubjects() { return this.#subjects.all(); }
  getSubject(id) { return this.#subjects.getById(id); }

  createSubject({ name, description = "", color = "#2F5D50" }) {
    if (!name || !name.trim()) throw new Error("Subject name is required.");
    const subject = new Subject({ id: makeId("subj"), name: name.trim(), description, color });
    this.#subjects.save(subject);
    return subject;
  }

  // ---- Topic management ----

  listTopics(subjectId) { return this.#topics.query((t) => t.subjectId === subjectId); }
  getTopic(id) { return this.#topics.getById(id); }
  listAllTopics() { return this.#topics.all(); }

  createTopic({ subjectId, name, description = "" }) {
    if (!subjectId) throw new Error("subjectId is required to create a topic.");
    if (!name || !name.trim()) throw new Error("Topic name is required.");
    if (!this.#subjects.getById(subjectId)) throw new Error("Subject not found.");
    const topic = new Topic({ id: makeId("top"), subjectId, name: name.trim(), description });
    this.#topics.save(topic);
    return topic;
  }

  // ---- Quiz management ----

  listQuizzes(topicId) { return this.#quizzes.query((q) => q.topicId === topicId); }
  listAllQuizzes() { return this.#quizzes.all(); }
  getQuiz(id) { return this.#quizzes.getById(id); }

  /**
   * Create a new quiz with optional questions.
   * @param {{ subjectId, topicId, title, description, difficulty, timeLimitSeconds, questions }} opts
   */
  createQuiz({ subjectId, topicId, title, description = "", difficulty = "medium", timeLimitSeconds = 0, questions = [] }) {
    if (!subjectId || !topicId || !title) throw new Error("subjectId, topicId, and title are required.");
    if (!this.#quizzes.getById) throw new Error("Repository error.");

    // Assign stable IDs to questions and choices if they lack them
    const stampedQuestions = questions.map((q) => ({
      ...q,
      id: q.id || makeId("q"),
      choices: (q.choices || []).map((c) => ({ ...c, id: c.id || makeId("ch") })),
    }));

    const quiz = new Quiz({ id: makeId("quiz"), subjectId, topicId, title, description, difficulty, timeLimitSeconds, questions: stampedQuestions });
    this.#quizzes.save(quiz);
    return quiz;
  }

  /**
   * Add a question to an existing quiz.
   * @param {string} quizId
   * @param {{ prompt, choices:[{text}], correctChoiceIndex:number, explanation }} opts
   */
  addQuestion(quizId, { prompt, choices = [], correctChoiceIndex = 0, explanation = "" }) {
    const quiz = this.getQuiz(quizId);
    if (!quiz) throw new Error("Quiz not found.");
    if (choices.length < 2) throw new Error("A question must have at least 2 choices.");

    const choiceObjs = choices.map((c, i) => ({ id: makeId("ch"), text: typeof c === "string" ? c : c.text }));
    const correctChoiceId = choiceObjs[correctChoiceIndex]?.id;
    if (!correctChoiceId) throw new Error("correctChoiceIndex out of range.");

    const question = new Question({ id: makeId("q"), topicId: quiz.topicId, prompt, choices: choiceObjs, correctChoiceId, explanation });

    // Rebuild quiz with the new question appended
    const updatedQuiz = new Quiz({ ...quiz.toJSON(), questions: [...quiz.questions.map((q) => q.toJSON()), question.toJSON()] });
    this.#quizzes.save(updatedQuiz);
    return { quiz: updatedQuiz, question };
  }

  // ---- Quiz taking ----

  /**
   * @param {string} studentId
   * @param {string} quizId
   * @param {Map<string,string>} answersByQuestionId
   * @param {number} [timeTakenSeconds]
   */
  submitAttempt(studentId, quizId, answersByQuestionId, timeTakenSeconds = 0) {
    const quiz = this.getQuiz(quizId);
    if (!quiz) throw new Error("Quiz not found.");
    const { score, total, percentage, breakdown, timeTakenSeconds: gradeTime } = quiz.grade(answersByQuestionId, timeTakenSeconds);

    const attempt = new QuizAttempt({
      id: makeId("attempt"),
      studentId,
      quizId,
      subjectId: quiz.subjectId,
      topicId: quiz.topicId,
      answers: breakdown.map((b) => ({ questionId: b.questionId, chosenChoiceId: b.chosenId, correct: b.correct })),
      score, total, percentage,
      timeTakenSeconds: gradeTime,
    });
    this.#attempts.save(attempt);
    return { attempt, breakdown };
  }

  listAttempts(studentId) {
    return this.#attempts
      .query((a) => a.studentId === studentId)
      .sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
  }

  getAttempt(id) { return this.#attempts.getById(id); }
}
