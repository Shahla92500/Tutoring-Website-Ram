import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testQuestions } from "../data/testQuestions";
import { useAppContext } from "../context/AppContext";

interface TestState {
  running: boolean;
  currentIndex: number;
  answers: Array<number | null>;
  explanations: string[];
}

export default function AssessmentPage() {
  const { currentUser, db, canUseAssessment, submitQuestionnaire, submitTest } = useAppContext();
  const navigate = useNavigate();
  const [questionnaireFeedback, setQuestionnaireFeedback] = useState("");
  const [testFeedback, setTestFeedback] = useState("");
  const [testState, setTestState] = useState<TestState>({
    running: false,
    currentIndex: 0,
    answers: [],
    explanations: []
  });

  const latestQuestionnaire = useMemo(
    () => (currentUser ? [...db.questionnaires].reverse().find((q) => q.userId === currentUser.id) : undefined),
    [db.questionnaires, currentUser]
  );

  const latestTest = useMemo(
    () => (currentUser ? [...db.tests].reverse().find((t) => t.userId === currentUser.id) : undefined),
    [db.tests, currentUser]
  );

  const activeQuestion = testQuestions[testState.currentIndex];

  function handleQuestionnaireSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    submitQuestionnaire({
      grade: String(fd.get("grade") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      goal: String(fd.get("goal") ?? "")
    });
    setQuestionnaireFeedback("Questionnaire received.");
    e.currentTarget.reset();
  }

  function startTest() {
    setTestState({
      running: true,
      currentIndex: 0,
      answers: Array(testQuestions.length).fill(null),
      explanations: Array(testQuestions.length).fill("")
    });
    setTestFeedback("");
  }

  function validateCurrentQuestion(): boolean {
    const idx = testState.currentIndex;
    const hasAnswer = testState.answers[idx] !== null;
    const hasExplanation = Boolean(testState.explanations[idx]?.trim());
    if (!hasAnswer || !hasExplanation) {
      setTestFeedback("Select an answer and add a short explanation.");
      return false;
    }
    setTestFeedback("");
    return true;
  }

  function goNextQuestion() {
    if (!validateCurrentQuestion()) return;
    setTestState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
  }

  function goPrevQuestion() {
    setTestState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }

  function leaveTest() {
    if (!testState.running) return;
    if (!window.confirm("Leaving now will lose all progress. Continue?")) return;
    setTestState({ running: false, currentIndex: 0, answers: [], explanations: [] });
    setTestFeedback("Progress discarded.");
  }

  function submitCurrentTest() {
    if (!validateCurrentQuestion()) return;
    if (testState.answers.some((a) => a === null)) {
      setTestFeedback("Please answer all questions before submitting.");
      return;
    }

    const result = submitTest(
      testState.answers.map((a) => (a === null ? -1 : a)),
      [...testState.explanations]
    );

    setTestFeedback(`Result: ${result.score}/${result.total}. Recommended start: ${result.recommendation}`);
    setTestState({ running: false, currentIndex: 0, answers: [], explanations: [] });
  }

  return (
    <section data-page="assessment" className="page">
      <h2>Assessment</h2>
      <p className="muted">Login is required to access assessment tools.</p>

      {!canUseAssessment ? (
        <div className="card" id="assessment-gate">
          <p id="assessment-gate-message">Login is required to start questionnaire and test.</p>
          <button className="primary" onClick={() => navigate("/login")}>Login Required</button>
        </div>
      ) : (
        <div id="assessment-content">
          <div className="card">
            <h3>Onboarding Questionnaire (Optional)</h3>
            <form id="questionnaire-form" onSubmit={handleQuestionnaireSubmit}>
              <label>Grade/Level<input name="grade" required /></label>
              <label>Main Subject
                <select name="subject" required>
                  <option value="">Select...</option>
                  <option>Math</option>
                  <option>Physics</option>
                  <option>Both</option>
                </select>
              </label>
              <label>Goal<input name="goal" required /></label>
              <button className="primary" type="submit">Submit Questionnaire</button>
            </form>
            <p className="feedback">{questionnaireFeedback}</p>
          </div>

          <div className="card">
            <h3>Self-Assessment Test</h3>
            <p className="muted">Multiple choice + short explanation for each question.</p>

            {!testState.running ? (
              <div id="test-start-wrap">
                <button className="primary" id="start-test" onClick={startTest}>Start Test</button>
              </div>
            ) : (
              <div id="test-wrap">
                <p id="test-progress">Question {testState.currentIndex + 1} of {testQuestions.length}</p>
                <h4 id="test-question">{activeQuestion.text}</h4>

                <div id="test-options" className="list">
                  {activeQuestion.options.map((option, index) => (
                    <div className="list-item" key={option}>
                      <label className="check-row">
                        <input
                          type="radio"
                          name="answer"
                          checked={testState.answers[testState.currentIndex] === index}
                          onChange={() => {
                            setTestState((prev) => {
                              const answers = [...prev.answers];
                              answers[prev.currentIndex] = index;
                              return { ...prev, answers };
                            });
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <label>
                  Explain your approach
                  <textarea
                    id="test-explanation"
                    rows={3}
                    value={testState.explanations[testState.currentIndex] ?? ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      setTestState((prev) => {
                        const explanations = [...prev.explanations];
                        explanations[prev.currentIndex] = text;
                        return { ...prev, explanations };
                      });
                    }}
                    required
                  />
                </label>

                <div className="row">
                  <button type="button" id="test-prev" onClick={goPrevQuestion} disabled={testState.currentIndex === 0}>Back</button>
                  {testState.currentIndex < testQuestions.length - 1 ? (
                    <button type="button" id="test-next" onClick={goNextQuestion}>Next</button>
                  ) : (
                    <button type="button" className="primary" id="test-submit" onClick={submitCurrentTest}>Submit Test</button>
                  )}
                  <button type="button" className="danger" id="test-leave" onClick={leaveTest}>Leave Test</button>
                </div>
              </div>
            )}
            <p className="feedback">{testFeedback}</p>
          </div>

          <div className="card" id="assessment-history">
            <h3>Assessment History</h3>
            <p>
              {latestQuestionnaire
                ? `Questionnaire submitted on ${new Date(latestQuestionnaire.createdAt).toLocaleString()}`
                : "No questionnaire yet."}
            </p>
            <p>
              {latestTest
                ? `Latest test: ${latestTest.score}/${latestTest.total} - Recommended start: ${latestTest.recommendation}`
                : "No test attempt yet."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
