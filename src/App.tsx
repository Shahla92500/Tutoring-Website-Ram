import { FormEvent, useEffect, useMemo, useState } from "react";
import { testQuestions } from "./data/testQuestions";
import { uid } from "./lib/id";
import { loadDB, saveDB } from "./lib/storage";
import type { Course, DB, FaqItem, Review, Route, User } from "./types";

type CourseCategory = "All" | Course["category"];

interface TestState {
  running: boolean;
  currentIndex: number;
  answers: Array<number | null>;
  explanations: string[];
}

const categories: CourseCategory[] = ["All", "University Courses", "High School Courses", "Exam Prep"];

function cloneDB(db: DB): DB {
  return JSON.parse(JSON.stringify(db)) as DB;
}

function stars(n: number): string {
  const safe = Math.max(1, Math.min(5, n));
  return `${"★".repeat(safe)}${"☆".repeat(5 - safe)}`;
}

function App() {
  const [db, setDB] = useState<DB>(() => loadDB());
  const [route, setRoute] = useState<Route>("home");

  const [faqOpenMap, setFaqOpenMap] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>("All");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [signupFeedback, setSignupFeedback] = useState("");
  const [loginFeedback, setLoginFeedback] = useState("");
  const [contactFeedback, setContactFeedback] = useState("");
  const [questionnaireFeedback, setQuestionnaireFeedback] = useState("");
  const [testFeedback, setTestFeedback] = useState("");

  const [testState, setTestState] = useState<TestState>({
    running: false,
    currentIndex: 0,
    answers: [],
    explanations: []
  });

  const currentUser = useMemo<User | null>(
    () => db.users.find((u) => u.id === db.currentUserId) ?? null,
    [db.users, db.currentUserId]
  );

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const filteredCourses = useMemo(() => {
    if (categoryFilter === "All") return db.courses;
    return db.courses.filter((c) => c.category === categoryFilter);
  }, [db.courses, categoryFilter]);

  const selectedCourse = useMemo(() => {
    if (!filteredCourses.length) return null;
    return filteredCourses.find((c) => c.id === selectedCourseId) ?? filteredCourses[0];
  }, [filteredCourses, selectedCourseId]);

  useEffect(() => {
    if (!filteredCourses.length) {
      setSelectedCourseId("");
      return;
    }
    if (!filteredCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(filteredCourses[0].id);
    }
  }, [filteredCourses, selectedCourseId]);

  function updateDB(mutator: (draft: DB) => void): void {
    setDB((prev) => {
      const draft = cloneDB(prev);
      mutator(draft);
      return draft;
    });
  }

  function navigate(nextRoute: Route): void {
    setRoute(nextRoute);
    setSignupFeedback("");
    setLoginFeedback("");
    setContactFeedback("");
  }

  function logout(): void {
    updateDB((draft) => {
      draft.currentUserId = null;
    });
    setRoute("home");
  }

  function handleLoginSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");

    const user = db.users.find((u) => u.email.toLowerCase() === email && u.password === password);
    if (!user) {
      setLoginFeedback("Invalid credentials.");
      return;
    }

    updateDB((draft) => {
      draft.currentUserId = user.id;
    });

    setLoginFeedback("Logged in successfully.");
    setRoute("home");
    e.currentTarget.reset();
  }

  function handleSignupSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();

    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      setSignupFeedback("Email already exists.");
      return;
    }

    updateDB((draft) => {
      draft.users.push({
        id: uid(),
        name: String(fd.get("name") ?? ""),
        email,
        password: String(fd.get("password") ?? ""),
        role: String(fd.get("role") ?? "student") as User["role"]
      });
    });

    setSignupFeedback("Account created. You can login now.");
    e.currentTarget.reset();
  }

  function handleContactSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();

    if (!/.+@.+\..+/.test(email)) {
      setContactFeedback("Please enter a valid email.");
      return;
    }

    updateDB((draft) => {
      draft.requests.push({
        id: uid(),
        userId: currentUser?.id ?? null,
        name: String(fd.get("name") ?? ""),
        contactMethod: String(fd.get("contactMethod") ?? ""),
        email,
        phone: String(fd.get("phone") ?? ""),
        serviceType: String(fd.get("serviceType") ?? ""),
        subject: String(fd.get("subject") ?? ""),
        urgencyWindow: String(fd.get("urgencyWindow") ?? ""),
        isUrgent: String(fd.get("isUrgent") ?? "No"),
        hardTopics: String(fd.get("hardTopics") ?? ""),
        preferredSlot: String(fd.get("preferredSlot") ?? ""),
        earliestDate: String(fd.get("earliestDate") ?? ""),
        message: String(fd.get("message") ?? ""),
        consultation: fd.get("consultation") === "on",
        status: "new",
        createdAt: new Date().toISOString()
      });
    });

    setContactFeedback("Request submitted successfully.");
    e.currentTarget.reset();
  }

  function handleQuestionnaireSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!currentUser) return;

    const fd = new FormData(e.currentTarget);
    updateDB((draft) => {
      draft.questionnaires.push({
        id: uid(),
        userId: currentUser.id,
        grade: String(fd.get("grade") ?? ""),
        subject: String(fd.get("subject") ?? ""),
        goal: String(fd.get("goal") ?? ""),
        createdAt: new Date().toISOString()
      });
    });

    setQuestionnaireFeedback("Questionnaire received.");
    e.currentTarget.reset();
  }

  function startTest(): void {
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

  function goNextQuestion(): void {
    if (!validateCurrentQuestion()) return;
    setTestState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
  }

  function goPrevQuestion(): void {
    setTestState((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }

  function leaveTest(): void {
    if (!testState.running) return;
    if (!window.confirm("Leaving now will lose all progress. Continue?")) return;
    setTestState({ running: false, currentIndex: 0, answers: [], explanations: [] });
    setTestFeedback("Progress discarded.");
  }

  function submitTest(): void {
    if (!validateCurrentQuestion() || !currentUser) return;

    let score = 0;
    const tagScores: Record<string, number> = {};

    testQuestions.forEach((q, i) => {
      if (testState.answers[i] === q.correctIndex) {
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
        answers: testState.answers.map((a) => (a === null ? -1 : a)),
        explanations: [...testState.explanations],
        score,
        total: testQuestions.length,
        recommendation,
        createdAt: new Date().toISOString()
      });
    });

    setTestFeedback(`Result: ${score}/${testQuestions.length}. Recommended start: ${recommendation}`);
    setTestState({ running: false, currentIndex: 0, answers: [], explanations: [] });
  }

  function updateRequestStatus(requestId: string, status: "replied" | "closed"): void {
    updateDB((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (req) req.status = status;
    });
  }

  function addCourse(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "tutor")) return;

    const fd = new FormData(e.currentTarget);
    updateDB((draft) => {
      draft.courses.push({
        id: uid(),
        title: String(fd.get("title") ?? ""),
        category: String(fd.get("category") ?? "University Courses") as Course["category"],
        description: String(fd.get("description") ?? "")
      });
    });

    e.currentTarget.reset();
  }

  function deleteCourse(courseId: string): void {
    updateDB((draft) => {
      draft.courses = draft.courses.filter((c) => c.id !== courseId);
    });
  }

  function addReview(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "tutor")) return;

    const fd = new FormData(e.currentTarget);
    updateDB((draft) => {
      draft.reviews.push({
        id: uid(),
        name: String(fd.get("name") ?? ""),
        rating: Number(fd.get("rating") ?? 5),
        text: String(fd.get("text") ?? "")
      });
    });

    e.currentTarget.reset();
  }

  function deleteReview(reviewId: string): void {
    updateDB((draft) => {
      draft.reviews = draft.reviews.filter((r) => r.id !== reviewId);
    });
  }

  function addFaq(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;

    const fd = new FormData(e.currentTarget);
    updateDB((draft) => {
      draft.faq.push({
        id: uid(),
        question: String(fd.get("question") ?? ""),
        answer: String(fd.get("answer") ?? "")
      });
    });
    e.currentTarget.reset();
  }

  function deleteFaq(faqId: string): void {
    updateDB((draft) => {
      draft.faq = draft.faq.filter((f) => f.id !== faqId);
    });
  }

  const canUseAssessment = currentUser?.role === "student" || currentUser?.role === "parent";
  const latestQuestionnaire = currentUser
    ? [...db.questionnaires].reverse().find((q) => q.userId === currentUser.id)
    : undefined;
  const latestTest = currentUser ? [...db.tests].reverse().find((t) => t.userId === currentUser.id) : undefined;

  const activeQuestion = testQuestions[testState.currentIndex];

  const myRequests = currentUser ? db.requests.filter((r) => r.userId === currentUser.id) : [];

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <h1 className="brand">
            <span className="brand-icon" aria-hidden="true" /> TutorPro
          </h1>
          <nav>
            <ul className="nav-links" id="main-nav">
              <li><button data-route="home" className={`nav-btn ${route === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button></li>
              <li><button data-route="courses" className={`nav-btn ${route === "courses" ? "active" : ""}`} onClick={() => navigate("courses")}>Courses</button></li>
              <li><button data-route="exam-prep" className={`nav-btn ${route === "exam-prep" ? "active" : ""}`} onClick={() => navigate("exam-prep")}>Exam Prep</button></li>
              <li><button data-route="assessment" className={`nav-btn ${route === "assessment" ? "active" : ""}`} onClick={() => navigate("assessment")}>Assessment</button></li>
              <li><button data-route="contact" className={`nav-btn ${route === "contact" ? "active" : ""}`} onClick={() => navigate("contact")}>Contact</button></li>
              <li>
                {currentUser ? (
                  <button className="nav-btn" onClick={logout}>Logout ({currentUser.role})</button>
                ) : (
                  <button data-route="login" className={`nav-btn ${route === "login" ? "active" : ""}`} onClick={() => navigate("login")}>Login</button>
                )}
              </li>
              {currentUser ? (
                <li><button data-route="dashboard" className={`nav-btn ${route === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}>Dashboard</button></li>
              ) : null}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container" id="app">
        {route === "home" ? (
          <section data-page="home" className="page active">
            <div className="home-grid">
              <div className="home-main">
                <div className="hero hero-banner">
                  <div className="hero-copy">
                    <p className="hero-kicker">Math and Physics Tutoring</p>
                    <h2>Ace Math and Physics with Expert Tutoring</h2>
                    <p>Personalized support for University, IB, AP, SAT, and A-Level students.</p>
                    <button className="primary" onClick={() => navigate("contact")}>Get Started</button>
                  </div>
                </div>

                <section className="card" id="teaching-style">
                  <div className="teaching-grid">
                    <div>
                      <h3>Teaching Style</h3>
                      <p>
                        Concept-first teaching with targeted practice. We break topics into manageable steps,
                        identify gaps quickly, and build confidence through structured solving strategies.
                      </p>
                      <button className="primary" onClick={() => navigate("exam-prep")}>Sample Video</button>
                    </div>
                    <div className="video-wrap">
                      <video controls preload="metadata">
                        <source src="assets/sample-lesson.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <p className="muted">If the video cannot load, use an external sample link.</p>
                    </div>
                  </div>
                </section>

                <section className="card">
                  <h3>Student Reviews</h3>
                  <div id="reviews-list" className="list">
                    {db.reviews.length ? (
                      db.reviews.map((review: Review) => (
                        <div className="list-item" key={review.id}>
                          <strong>{review.name}</strong> <span className="muted">{stars(Number(review.rating))}</span>
                          <p>{review.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="list-item muted">No reviews yet</div>
                    )}
                  </div>
                </section>

                <section className="card">
                  <h3>Frequently Asked Questions</h3>
                  <div id="faq-list" className="accordion">
                    {db.faq.length ? (
                      db.faq.map((faq: FaqItem) => (
                        <div className="accordion-item" key={faq.id}>
                          <button className="accordion-q" onClick={() => setFaqOpenMap((prev) => ({ ...prev, [faq.id]: !prev[faq.id] }))}>
                            {faq.question}
                          </button>
                          <div className={`accordion-a ${faqOpenMap[faq.id] ? "" : "hidden"}`}>{faq.answer}</div>
                        </div>
                      ))
                    ) : (
                      <div className="list-item muted">No FAQ items yet.</div>
                    )}
                  </div>
                  <button className="primary" onClick={() => navigate("contact")}>Contact Me</button>
                </section>
              </div>

              <aside className="home-side">
                <section className="card side-panel top">
                  <div className="side-head">
                    <h3>Login to Your Account</h3>
                    <button className="primary" onClick={() => navigate("login")}>Login</button>
                  </div>
                  <p className="muted">Access assessments, booking history, and progress records.</p>
                </section>

                <section className="card side-panel image">
                  <h3>Teaching for Physics</h3>
                  <p className="muted">Mechanics, algebra, and exam strategy with step-by-step guidance.</p>
                  <ul className="quick-links">
                    <li><button onClick={() => navigate("courses")}>See course topics</button></li>
                    <li><button onClick={() => navigate("assessment")}>Do assessment</button></li>
                    <li><button onClick={() => navigate("contact")}>Tutoring request</button></li>
                  </ul>
                </section>

                <section className="card side-panel">
                  <h3>Quick Contact</h3>
                  <p className="muted">For consultation and availability.</p>
                  <p><strong>Email:</strong> tutor@example.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </section>
              </aside>
            </div>
          </section>
        ) : null}

        {route === "courses" ? (
          <section data-page="courses" className="page active">
            <h2>Courses</h2>
            <p className="muted">Filter by category and select a course to view topics covered.</p>
            <div className="filters">
              <label>
                Category
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CourseCategory)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>
              <label>
                Course
                <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                  {filteredCourses.length ? (
                    filteredCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))
                  ) : (
                    <option value="">No courses</option>
                  )}
                </select>
              </label>
            </div>
            <div className="card" id="course-details">
              {selectedCourse ? (
                <>
                  <h3>{selectedCourse.title}</h3>
                  <p><strong>Category:</strong> {selectedCourse.category}</p>
                  <p>{selectedCourse.description}</p>
                </>
              ) : (
                <p className="muted">No courses found for this category.</p>
              )}
            </div>
          </section>
        ) : null}

        {route === "exam-prep" ? (
          <section data-page="exam-prep" className="page active">
            <h2>Exam Prep</h2>
            <p>
              Dedicated tracks for IB, AP, SAT, and A-Levels with timing strategy, topic targeting,
              and confidence-building mock sessions.
            </p>
            <ul className="exam-list">
              <li><strong>IB:</strong> Math AA/AI, Physics HL/SL.</li>
              <li><strong>AP:</strong> AP Calculus AB/BC, AP Physics 1/C.</li>
              <li><strong>SAT:</strong> Quant strategy, algebra refresh, timed practice.</li>
              <li><strong>A-Levels:</strong> Pure Math, Mechanics, and exam drills.</li>
            </ul>
          </section>
        ) : null}

        {route === "assessment" ? (
          <section data-page="assessment" className="page active">
            <h2>Assessment</h2>
            <p className="muted">Login is required to access assessment tools.</p>

            {!canUseAssessment ? (
              <div className="card" id="assessment-gate">
                <p id="assessment-gate-message">Login is required to start questionnaire and test.</p>
                <button className="primary" onClick={() => navigate("login")}>Login Required</button>
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
                        {activeQuestion.options.map((opt, index) => (
                          <div className="list-item" key={opt}>
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
                              <span>{opt}</span>
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
                        <button id="test-prev" type="button" onClick={goPrevQuestion} disabled={testState.currentIndex === 0}>Back</button>
                        {testState.currentIndex < testQuestions.length - 1 ? (
                          <button id="test-next" type="button" onClick={goNextQuestion}>Next</button>
                        ) : (
                          <button className="primary" id="test-submit" type="button" onClick={submitTest}>Submit Test</button>
                        )}
                        <button className="danger" id="test-leave" type="button" onClick={leaveTest}>Leave Test</button>
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
        ) : null}

        {route === "contact" ? (
          <section data-page="contact" className="page active">
            <h2>Contact / Booking Request</h2>
            <form id="contact-form" className="card" onSubmit={handleContactSubmit}>
              <label>Name<input name="name" required /></label>
              <label>Best Way to Contact
                <select name="contactMethod" required>
                  <option value="">Select...</option>
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </label>
              <label>Email<input name="email" type="email" required /></label>
              <label>Phone<input name="phone" /></label>
              <label>Tutoring Service Type
                <select name="serviceType" required>
                  <option value="">Select...</option>
                  <option>High School</option>
                  <option>University</option>
                  <option>Exam Prep</option>
                </select>
              </label>
              <label>Subject<input name="subject" placeholder="Math / Physics / ..." /></label>
              <label>Exam Urgency
                <select name="urgencyWindow">
                  <option value="">Select...</option>
                  <option>Within 2 weeks</option>
                  <option>Within 1 month</option>
                  <option>Within 3 months</option>
                </select>
              </label>
              <label>Is This Urgent?
                <select name="isUrgent">
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </label>
              <label>Hard Topics<textarea name="hardTopics" rows={2} /></label>
              <label>Preferred Slot<input name="preferredSlot" type="text" placeholder="Mon/Wed 6-8PM" /></label>
              <label>Earliest Consultation Date<input name="earliestDate" type="date" /></label>
              <label>Message<textarea name="message" required rows={4} /></label>
              <label className="check-row"><input name="consultation" type="checkbox" /> Request consultation session</label>
              <label className="check-row"><input name="notRobot" type="checkbox" required /> I'm not a robot</label>
              <button className="primary" type="submit">Submit Request</button>
              <p className="feedback">{contactFeedback}</p>
            </form>
          </section>
        ) : null}

        {route === "login" ? (
          <section data-page="login" className="page active">
            <h2>Login / Signup</h2>
            <div className="grid-2">
              <form id="login-form" className="card" onSubmit={handleLoginSubmit}>
                <h3>Login with Email</h3>
                <label>Email<input name="email" type="email" required /></label>
                <label>Password<input name="password" type="password" required /></label>
                <button className="primary" type="submit">Login</button>
                <p className="feedback">{loginFeedback}</p>
              </form>
              <form id="signup-form" className="card" onSubmit={handleSignupSubmit}>
                <h3>Create Account</h3>
                <label>Name<input name="name" required /></label>
                <label>Email<input name="email" type="email" required /></label>
                <label>Password<input name="password" type="password" required /></label>
                <label>Role
                  <select name="role" required>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button className="primary" type="submit">Create Account</button>
                <p className="feedback">{signupFeedback}</p>
              </form>
            </div>
            <div className="card">
              <h3>Additional Auth (Planned)</h3>
              <p>Google login and forgot-password email flow are future integrations.</p>
            </div>
          </section>
        ) : null}

        {route === "dashboard" ? (
          <section data-page="dashboard" className="page active">
            <h2>{currentUser ? `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1)} Dashboard` : "Dashboard"}</h2>

            {!currentUser ? (
              <div className="card">
                <p>Login required.</p>
              </div>
            ) : null}

            {currentUser && (currentUser.role === "student" || currentUser.role === "parent") ? (
              <div className="card" id="student-request-history">
                <h3>My Booking Requests</h3>
                {myRequests.length ? (
                  myRequests.map((r) => (
                    <div className="list-item" key={r.id}>
                      <strong>{r.serviceType}</strong> - {r.status}
                      <p>{r.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted">No requests yet.</p>
                )}
              </div>
            ) : null}

            {currentUser && (currentUser.role === "tutor" || currentUser.role === "admin") ? (
              <div id="tutor-admin-dashboard">
                <div className="card">
                  <h3>Incoming Requests</h3>
                  {db.requests.length ? (
                    [...db.requests].reverse().map((request) => (
                      <div className="list-item" key={request.id}>
                        <p><strong>{request.name}</strong> | {request.serviceType} | status: {request.status}</p>
                        <p>{request.message}</p>
                        <div className="row">
                          <button type="button" onClick={() => updateRequestStatus(request.id, "replied")}>Mark Replied</button>
                          <button type="button" onClick={() => updateRequestStatus(request.id, "closed")}>Mark Closed</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No incoming requests yet.</p>
                  )}
                </div>

                <div className="card">
                  <h3>Manage Courses</h3>
                  <form onSubmit={addCourse}>
                    <label>Title<input name="title" required /></label>
                    <label>Category
                      <select name="category" required>
                        <option>University Courses</option>
                        <option>High School Courses</option>
                        <option>Exam Prep</option>
                      </select>
                    </label>
                    <label>Topics/Description<textarea name="description" rows={3} required /></label>
                    <button className="primary" type="submit">Add Course</button>
                  </form>
                  <div className="list">
                    {db.courses.map((course: Course) => (
                      <div className="list-item" key={course.id}>
                        <strong>{course.title}</strong> <span className="muted">({course.category})</span>
                        <p>{course.description}</p>
                        <button className="danger" type="button" onClick={() => deleteCourse(course.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>Manage Reviews</h3>
                  <form onSubmit={addReview}>
                    <label>Name/Initials<input name="name" required /></label>
                    <label>Rating (1-5)<input name="rating" type="number" min={1} max={5} required /></label>
                    <label>Review<textarea name="text" rows={2} required /></label>
                    <button className="primary" type="submit">Add Review</button>
                  </form>
                  <div className="list">
                    {db.reviews.map((review: Review) => (
                      <div className="list-item" key={review.id}>
                        <strong>{review.name}</strong> {stars(Number(review.rating))}
                        <p>{review.text}</p>
                        <button className="danger" type="button" onClick={() => deleteReview(review.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>

                {currentUser.role === "admin" ? (
                  <div className="card">
                    <h3>Manage FAQ (Admin Only)</h3>
                    <form onSubmit={addFaq}>
                      <label>Question<input name="question" required /></label>
                      <label>Answer<textarea name="answer" rows={2} required /></label>
                      <button className="primary" type="submit">Add FAQ</button>
                    </form>
                    <div className="list">
                      {db.faq.map((faq: FaqItem) => (
                        <div className="list-item" key={faq.id}>
                          <strong>{faq.question}</strong>
                          <p>{faq.answer}</p>
                          <button className="danger" type="button" onClick={() => deleteFaq(faq.id)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>© {new Date().getFullYear()} TutorPro MVP</small>
        </div>
      </footer>
    </>
  );
}

export default App;
