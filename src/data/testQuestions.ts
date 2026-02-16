import type { TestQuestion } from "../types";

export const testQuestions: TestQuestion[] = [
  {
    id: "q1",
    text: "If 2x + 5 = 17, what is x?",
    options: ["4", "5", "6", "8"],
    correctIndex: 2,
    recommendationTag: "Algebra Foundations"
  },
  {
    id: "q2",
    text: "What is sin(30°)?",
    options: ["1", "1/2", "sqrt(2)/2", "sqrt(3)/2"],
    correctIndex: 1,
    recommendationTag: "Trigonometry Basics"
  },
  {
    id: "q3",
    text: "Sequence: 3, 6, 12, 24, ... next value?",
    options: ["30", "36", "42", "48"],
    correctIndex: 3,
    recommendationTag: "Patterns and Sequences"
  }
];
