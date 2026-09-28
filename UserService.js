import { Student } from "../models/Student.js";

/**
 * UserService — owns Student accounts, auth, roles, profile info.
 * This milestone runs single-user (no real login screen yet); the
 * service still exists as its own boundary so a real auth flow can be
 * dropped in later without QuizService/StudyTrackerService knowing.
 */
export class UserService {
  #students;

  constructor({ students }) {
    this.#students = students;
  }

  currentStudent() {
    let student = this.#students.getById("student_demo");
    if (!student) {
      const all = this.#students.all();
      if (all.length > 0) return all[0];
      student = new Student({
        id: "student_demo",
        name: "Mark",
        email: "mark@example.com",
        passwordHash: "demo",
        program: "BS Computer Science",
        gradeLevel: "3rd Year",
      });
      this.#students.save(student);
    }
    return student;
  }

  updateProfile(studentId, { name }) {
    const student = this.#students.getById(studentId);
    if (!student) throw new Error("Student not found.");
    if (name) student.renameTo(name);
    this.#students.save(student);
    return student;
  }

  /** Called by StudyTrackerService after logging a session, to keep streaks in sync. */
  recordStudyDay(studentId, isoDate) {
    const student = this.#students.getById(studentId);
    if (!student) return;
    student.registerStudyDay(isoDate);
    this.#students.save(student);
  }
}
