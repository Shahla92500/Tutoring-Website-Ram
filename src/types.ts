export type Role = "visitor" | "student" | "parent" | "tutor" | "admin";
export type Route = "home" | "courses" | "exam-prep" | "assessment" | "contact" | "login" | "dashboard";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "visitor">;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Course {
  id: string;
  title: string;
  category: "University Courses" | "High School Courses" | "Exam Prep";
  description: string;
}

export interface BookingRequest {
  id: string;
  userId: string | null;
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
  status: "new" | "replied" | "closed";
  createdAt: string;
}

export interface Questionnaire {
  id: string;
  userId: string;
  grade: string;
  subject: string;
  goal: string;
  createdAt: string;
}

export interface TestRecord {
  id: string;
  userId: string;
  answers: number[];
  explanations: string[];
  score: number;
  total: number;
  recommendation: string;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  recommendationTag: string;
}

export interface DB {
  users: User[];
  currentUserId: string | null;
  reviews: Review[];
  faq: FaqItem[];
  courses: Course[];
  requests: BookingRequest[];
  questionnaires: Questionnaire[];
  tests: TestRecord[];
}
