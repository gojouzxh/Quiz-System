/**
 * User — base account entity.
 * Abstraction: shared identity/auth concerns live here so subclasses
 * (Student, and future roles like Instructor/Admin) only add what differs.
 */
export class User {
  #id;
  #name;
  #email;
  #passwordHash; // never store plaintext, even in a mock system
  #role;
  #createdAt;

  constructor({ id, name, email, passwordHash, role = "student", createdAt = new Date().toISOString() }) {
    if (this.constructor === User) {
      throw new Error("User is abstract — instantiate Student (or another role) instead.");
    }
    this.#id = id;
    this.#name = name;
    this.#email = email;
    this.#passwordHash = passwordHash;
    this.#role = role;
    this.#createdAt = createdAt;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }
  get email() { return this.#email; }
  get role() { return this.#role; }
  get createdAt() { return this.#createdAt; }

  renameTo(newName) {
    if (!newName || !newName.trim()) throw new Error("Name cannot be empty.");
    this.#name = newName.trim();
  }

  verifyPassword(hash) {
    return this.#passwordHash === hash;
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      passwordHash: this.#passwordHash,
      role: this.#role,
      createdAt: this.#createdAt,
    };
  }
}
