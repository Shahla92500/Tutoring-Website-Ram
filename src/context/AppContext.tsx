import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { testQuestions } from "../data/testQuestions";
import { uid } from "../lib/id";
import { loadDB, saveDB } from "../lib/storage";
import type { Course, DB, User } from "../types";

interface ContactPayload {
  name: string;
  contactMethod: string;
  email: string;
  phone: string;
  serviceType: string;
  subject: string;
  urgencyWindow: string;
  isUrgent: string;
  hardTopics: string;
  preferredSlot: string;
  earliestDate: string;
  message: string;
  consultation: boolean;
}

interface QuestionnairePayload {
  grade: string;
  subject: string;
  goal: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: User["role"];
}

interface AppContextValue {
  db: DB;
  currentUser: User | null;
  canUseAssessment: boolean;
  login: (email: string, password: string) => { ok: boolean; message: string };
  signup: (payload: SignupPayload) => { ok: boolean; message: string };
  logout: () => void;
  submitContact: (payload: ContactPayload) => { ok: boolean; message: string };
  submitQuestionnaire: (payload: QuestionnairePayload) => void;
  submitTest: (answers: number[], explanations: string[]) => { score: number; total: number; recommendation: string };
  updateRequestStatus: (requestId: string, status: "replied" | "closed") => void;
  addCourse: (course: Omit<Course, "id">) => void;
  deleteCourse: (courseId: string) => void;
  addReview: (name: string, rating: number, text: string) => void;
  deleteReview: (reviewId: string) => void;
  addFaq: (question: string, answer: string) => void;
  deleteFaq: (faqId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function cloneDB(db: DB): DB {
  return JSON.parse(JSON.stringify(db)) as DB;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDB] = useState<DB>(() => loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const currentUser = useMemo(() => db.users.find((u) => u.id === db.currentUserId) ?? null, [db.users, db.currentUserId]);
  const canUseAssessment = currentUser?.role === "student" || currentUser?.role === "parent";

  function updateDB(mutator: (draft: DB) => void): void {
    setDB((prev) => {
      const draft = cloneDB(prev);
      mutator(draft);
      return draft;
    });
  }

  function login(email: string, password: string): { ok: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password);
    if (!user) return { ok: false, message: "Invalid credentials." };

    updateDB((draft) => {
      draft.currentUserId = user.id;
    });
    return { ok: true, message: "Logged in successfully." };
  }

  function signup(payload: SignupPayload): { ok: boolean; message: string } {
    const email = payload.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, message: "Email already exists." };
    }

    updateDB((draft) => {
      draft.users.push({
        id: uid(),
        name: payload.name,
        email,
        password: payload.password,
        role: payload.role
      });
    });
    return { ok: true, message: "Account created. You can login now." };
  }

  function logout(): void {
    updateDB((draft) => {
      draft.currentUserId = null;
    });
  }

  function submitContact(payload: ContactPayload): { ok: boolean; message: string } {
    const email = payload.email.trim();
    if (!/.+@.+\..+/.test(email)) {
      return { ok: false, message: "Please enter a valid email." };
    }

    updateDB((draft) => {
      draft.requests.push({
        id: uid(),
        userId: currentUser?.id ?? null,
        name: payload.name,
        contactMethod: payload.contactMethod,
        email,
        phone: payload.phone,
        serviceType: payload.serviceType,
        subject: payload.subject,
        urgencyWindow: payload.urgencyWindow,
        isUrgent: payload.isUrgent,
        hardTopics: payload.hardTopics,
        preferredSlot: payload.preferredSlot,
        earliestDate: payload.earliestDate,
        message: payload.message,
        consultation: payload.consultation,
        status: "new",
        createdAt: new Date().toISOString()
      });
    });

    return { ok: true, message: "Request submitted successfully." };
  }

  function submitQuestionnaire(payload: QuestionnairePayload): void {
    if (!currentUser) return;
    updateDB((draft) => {
      draft.questionnaires.push({
        id: uid(),
        userId: currentUser.id,
        grade: payload.grade,
        subject: payload.subject,
        goal: payload.goal,
        createdAt: new Date().toISOString()
      });
    });
  }

  function submitTest(answers: number[], explanations: string[]): { score: number; total: number; recommendation: string } {
    if (!currentUser) return { score: 0, total: testQuestions.length, recommendation: "" };

    let score = 0;
    const tagScores: Record<string, number> = {};

    testQuestions.forEach((q, index) => {
      if (answers[index] === q.correctIndex) {
        score += 1;
        tagScores[q.recommendationTag] = (tagScores[q.recommendationTag] ?? 0) + 1;
      }
    });

    const recommendation =
      score === 0
        ? "Book a consultation to determine starting point"
        : Object.entries(tagScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Algebra Foundations";

    updateDB((draft) => {
      draft.tests.push({
        id: uid(),
        userId: currentUser.id,
        answers,
        explanations,
        score,
        total: testQuestions.length,
        recommendation,
        createdAt: new Date().toISOString()
      });
    });

    return { score, total: testQuestions.length, recommendation };
  }

  function updateRequestStatus(requestId: string, status: "replied" | "closed"): void {
    updateDB((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (req) req.status = status;
    });
  }

  function addCourse(course: Omit<Course, "id">): void {
    updateDB((draft) => {
      draft.courses.push({ id: uid(), ...course });
    });
  }

  function deleteCourse(courseId: string): void {
    updateDB((draft) => {
      draft.courses = draft.courses.filter((c) => c.id !== courseId);
    });
  }

  function addReview(name: string, rating: number, text: string): void {
    updateDB((draft) => {
      draft.reviews.push({ id: uid(), name, rating, text });
    });
  }

  function deleteReview(reviewId: string): void {
    updateDB((draft) => {
      draft.reviews = draft.reviews.filter((r) => r.id !== reviewId);
    });
  }

  function addFaq(question: string, answer: string): void {
    updateDB((draft) => {
      draft.faq.push({ id: uid(), question, answer });
    });
  }

  function deleteFaq(faqId: string): void {
    updateDB((draft) => {
      draft.faq = draft.faq.filter((f) => f.id !== faqId);
    });
  }

  const value: AppContextValue = {
    db,
    currentUser,
    canUseAssessment,
    login,
    signup,
    logout,
    submitContact,
    submitQuestionnaire,
    submitTest,
    updateRequestStatus,
    addCourse,
    deleteCourse,
    addReview,
    deleteReview,
    addFaq,
    deleteFaq
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
