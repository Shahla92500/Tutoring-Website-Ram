import { FormEvent, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { stars } from "../lib/format";
import type { Course, CourseProgressStatus, FaqItem, Review, SelectableOptionKey, User } from "../types";

const optionGroupLabels: Record<SelectableOptionKey, string> = {
  contactMethods: "Contact Methods",
  serviceTypes: "Tutoring Service Types",
  urgencyWindows: "Exam Urgency Windows",
  urgencyFlags: "Urgency Choices",
  assessmentSubjects: "Assessment Subjects",
  courseCategories: "Course Categories"
};

const optionGroupKeys = Object.keys(optionGroupLabels) as SelectableOptionKey[];

const courseStatusLabels: Record<CourseProgressStatus, string> = {
  registered: "Registered",
  "in-progress": "In Progress",
  passed: "Passed"
};

const learnerRoles: User["role"][] = ["student", "parent"];

export default function DashboardPage() {
  const {
    db,
    currentUser,
    updateRequestStatus,
    addCourse,
    deleteCourse,
    assignCourseToLearner,
    updateLearnerCourseStatus,
    deleteLearnerCourse,
    createTutor,
    resetLearnerAccount,
    addReview,
    deleteReview,
    addFaq,
    deleteFaq,
    addSelectableOption,
    updateSelectableOption,
    deleteSelectableOption
  } = useAppContext();
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<SelectableOptionKey>("contactMethods");
  const [optionFeedback, setOptionFeedback] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");

  const learners = useMemo(() => db.users.filter((user) => learnerRoles.includes(user.role)), [db.users]);
  const tutors = useMemo(() => db.users.filter((user) => user.role === "tutor"), [db.users]);
  const myRequests = currentUser ? db.requests.filter((request) => request.userId === currentUser.id) : [];
  const myTests = currentUser ? db.tests.filter((test) => test.userId === currentUser.id) : [];
  const myQuestionnaires = currentUser ? db.questionnaires.filter((item) => item.userId === currentUser.id) : [];
  const myCourseRecords = currentUser ? db.learnerCourses.filter((record) => record.userId === currentUser.id) : [];

  function handleAddCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    addCourse({
      title: String(fd.get("title") ?? ""),
      category: String(fd.get("category") ?? "University Courses"),
      description: String(fd.get("description") ?? "")
    });
    e.currentTarget.reset();
  }

  function handleAddReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "tutor")) return;
    const fd = new FormData(e.currentTarget);
    addReview(String(fd.get("name") ?? ""), Number(fd.get("rating") ?? 5), String(fd.get("text") ?? ""));
    e.currentTarget.reset();
  }

  function handleAddFaq(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    addFaq(String(fd.get("question") ?? ""), String(fd.get("answer") ?? ""));
    e.currentTarget.reset();
  }

  async function handleAddTutor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    const result = await createTutor({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? "")
    });
    setAdminFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  async function handleResetLearner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    const result = await resetLearnerAccount(String(fd.get("email") ?? ""));
    setAdminFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  function handleAssignCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    const result = assignCourseToLearner({
      userId: String(fd.get("userId") ?? ""),
      courseId: String(fd.get("courseId") ?? ""),
      status: String(fd.get("status") ?? "registered") as CourseProgressStatus
    });
    setAdminFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  async function handleAddSelectableOption(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    const result = await addSelectableOption(selectedOptionGroup, String(fd.get("optionValue") ?? ""));
    setOptionFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  async function handleUpdateSelectableOption(e: FormEvent<HTMLFormElement>, index: number) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return;
    const fd = new FormData(e.currentTarget);
    const result = await updateSelectableOption(selectedOptionGroup, index, String(fd.get("optionValue") ?? ""));
    setOptionFeedback(result.message);
  }

  function getCourse(courseId: string): Course | undefined {
    return db.courses.find((course) => course.id === courseId);
  }

  function getUser(userId: string): User | undefined {
    return db.users.find((user) => user.id === userId);
  }

  if (!currentUser) {
    return (
      <section data-page="dashboard" className="page">
        <h2>Dashboard</h2>
        <div className="card">
          <p>Login required.</p>
        </div>
      </section>
    );
  }

  return (
    <section data-page="dashboard" className="page dashboard-page">
      <DashboardHeader currentUser={currentUser} />

      {learnerRoles.includes(currentUser.role) ? (
        <LearnerDashboard
          currentUser={currentUser}
          courseRecords={myCourseRecords}
          courses={db.courses}
          requests={myRequests}
          tests={myTests}
          questionnaires={myQuestionnaires}
        />
      ) : null}

      {currentUser.role === "tutor" ? (
        <TutorDashboard
          currentUser={currentUser}
          requests={db.requests}
          courses={db.courses}
          reviews={db.reviews}
          updateRequestStatus={updateRequestStatus}
        />
      ) : null}

      {currentUser.role === "admin" ? (
        <div className="dashboard-stack" id="admin-dashboard">
          <div className="dashboard-grid">
            <StatCard label="Learners" value={learners.length} />
            <StatCard label="Tutors" value={tutors.length} />
            <StatCard label="Courses" value={db.courses.length} />
            <StatCard label="Open Requests" value={db.requests.filter((request) => request.status !== "closed").length} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Add Tutor</h3>
              <form onSubmit={handleAddTutor}>
                <label>Name<input name="name" required /></label>
                <label>Email<input name="email" type="email" required /></label>
                <label>Temporary Password<input name="password" type="password" minLength={8} required /></label>
                <button className="primary" type="submit">Create Tutor</button>
              </form>
            </div>

            <div className="card">
              <h3>Reset Learner Account</h3>
              <form onSubmit={handleResetLearner}>
                <label>Learner Email<input name="email" type="email" required /></label>
                <button className="primary" type="submit">Send Reset Link</button>
              </form>
              <p className="feedback">{adminFeedback}</p>
            </div>
          </div>

          <div className="grid-2">
            <ManageCoursesCard
              courses={db.courses}
              courseCategories={db.selectableOptions.courseCategories}
              onAdd={handleAddCourse}
              onDelete={deleteCourse}
            />

            <div className="card">
              <h3>Assign Course To Learner</h3>
              <form onSubmit={handleAssignCourse}>
                <label>Learner
                  <select name="userId" required>
                    <option value="">Select learner</option>
                    {learners.map((learner) => (
                      <option key={learner.id} value={learner.id}>{learner.name} - {learner.email}</option>
                    ))}
                  </select>
                </label>
                <label>Course
                  <select name="courseId" required>
                    <option value="">Select course</option>
                    {db.courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </label>
                <label>Status
                  <select name="status" required>
                    {Object.entries(courseStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <button className="primary" type="submit">Assign Course</button>
              </form>
            </div>
          </div>

          <div className="card">
            <h3>Learner Course Progress</h3>
            <div className="list">
              {db.learnerCourses.length ? db.learnerCourses.map((record) => {
                const learner = getUser(record.userId);
                const course = getCourse(record.courseId);
                return (
                  <div className="list-item learner-course-row" key={record.id}>
                    <div>
                      <strong>{learner?.name ?? "Unknown learner"}</strong>
                      <p className="muted">{course?.title ?? "Unknown course"} | {learner?.email ?? "No email"}</p>
                    </div>
                    <div className="row">
                      <select
                        aria-label="Course status"
                        value={record.status}
                        onChange={(e) => updateLearnerCourseStatus(record.id, e.target.value as CourseProgressStatus)}
                      >
                        {Object.entries(courseStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button className="danger" type="button" onClick={() => deleteLearnerCourse(record.id)}>Remove</button>
                    </div>
                  </div>
                );
              }) : <p className="muted">No learner courses assigned yet.</p>}
            </div>
          </div>

          <RequestsCard requests={db.requests} updateRequestStatus={updateRequestStatus} />

          <div className="grid-2">
            <ReviewsCard reviews={db.reviews} handleAddReview={handleAddReview} deleteReview={deleteReview} />
            <FaqCard faq={db.faq} handleAddFaq={handleAddFaq} deleteFaq={deleteFaq} />
          </div>

          <div className="card">
            <h3>Manage Student Form Options</h3>
            <label>
              Option Group
              <select
                value={selectedOptionGroup}
                onChange={(e) => {
                  setSelectedOptionGroup(e.target.value as SelectableOptionKey);
                  setOptionFeedback("");
                }}
              >
                {optionGroupKeys.map((key) => (
                  <option key={key} value={key}>{optionGroupLabels[key]}</option>
                ))}
              </select>
            </label>

            <form onSubmit={handleAddSelectableOption}>
              <label>New Option<input name="optionValue" required /></label>
              <button className="primary" type="submit">Add Option</button>
            </form>

            <div className="list">
              {db.selectableOptions[selectedOptionGroup].map((option, index) => (
                <form className="list-item" key={`${selectedOptionGroup}-${option}-${index}`} onSubmit={(e) => handleUpdateSelectableOption(e, index)}>
                  <label>Option Value<input name="optionValue" defaultValue={option} required /></label>
                  <div className="row">
                    <button type="submit">Save</button>
                    <button
                      className="danger"
                      type="button"
                      onClick={async () => {
                        const result = await deleteSelectableOption(selectedOptionGroup, index);
                        setOptionFeedback(result.ok ? "Option deleted." : result.message);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ))}
            </div>
            <p className="feedback">{optionFeedback}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DashboardHeader({ currentUser }: { currentUser: User }) {
  return (
    <div className="dashboard-hero">
      <div>
        <p className="hero-kicker">{currentUser.role} portal</p>
        <h2>{currentUser.name}</h2>
        <p>{currentUser.email}</p>
      </div>
      <span className="role-pill">{currentUser.role}</span>
    </div>
  );
}

function LearnerDashboard({
  currentUser,
  courseRecords,
  courses,
  requests,
  tests,
  questionnaires
}: {
  currentUser: User;
  courseRecords: { courseId: string; status: CourseProgressStatus; registeredAt: string; id: string }[];
  courses: Course[];
  requests: { id: string; serviceType: string; status: string; message: string }[];
  tests: { id: string; score: number; total: number; recommendation: string; createdAt: string }[];
  questionnaires: { id: string; subject: string; goal: string; createdAt: string }[];
}) {
  const statusCounts = courseRecords.reduce<Record<CourseProgressStatus, number>>(
    (acc, record) => ({ ...acc, [record.status]: acc[record.status] + 1 }),
    { registered: 0, "in-progress": 0, passed: 0 }
  );

  return (
    <div className="dashboard-stack" id="learner-dashboard">
      <div className="dashboard-grid">
        <StatCard label="Registered" value={statusCounts.registered} />
        <StatCard label="In Progress" value={statusCounts["in-progress"]} />
        <StatCard label="Passed" value={statusCounts.passed} />
        <StatCard label="Requests" value={requests.length} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>My Information</h3>
          <div className="profile-lines">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
          </div>
        </div>

        <div className="card">
          <h3>Assessment Summary</h3>
          {tests.length || questionnaires.length ? (
            <>
              {tests.slice(-2).map((test) => (
                <div className="list-item" key={test.id}>
                  <strong>{test.score}/{test.total}</strong>
                  <p>{test.recommendation}</p>
                </div>
              ))}
              {questionnaires.slice(-2).map((item) => (
                <div className="list-item" key={item.id}>
                  <strong>{item.subject}</strong>
                  <p>{item.goal}</p>
                </div>
              ))}
            </>
          ) : (
            <p className="muted">No assessment activity yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>My Courses</h3>
        <div className="course-progress-list">
          {courseRecords.length ? courseRecords.map((record) => {
            const course = courses.find((item) => item.id === record.courseId);
            return (
              <div className={`list-item status-${record.status}`} key={record.id}>
                <div className="course-progress-head">
                  <strong>{course?.title ?? "Course removed"}</strong>
                  <span>{courseStatusLabels[record.status]}</span>
                </div>
                <p className="muted">{course?.category ?? "No category"}</p>
                <p>{course?.description ?? "This course is no longer available."}</p>
              </div>
            );
          }) : (
            <p className="muted">No courses assigned yet.</p>
          )}
        </div>
      </div>

      <div className="card" id="student-request-history">
        <h3>My Booking Requests</h3>
        {requests.length ? (
          requests.map((request) => (
            <div className="list-item" key={request.id}>
              <strong>{request.serviceType}</strong> - {request.status}
              <p>{request.message}</p>
            </div>
          ))
        ) : (
          <p className="muted">No requests yet.</p>
        )}
      </div>
    </div>
  );
}

function TutorDashboard({
  currentUser,
  requests,
  courses,
  reviews,
  updateRequestStatus
}: {
  currentUser: User;
  requests: { id: string; name: string; serviceType: string; status: "new" | "replied" | "closed"; message: string }[];
  courses: Course[];
  reviews: Review[];
  updateRequestStatus: (requestId: string, status: "replied" | "closed") => void;
}) {
  return (
    <div className="dashboard-stack" id="tutor-dashboard">
      <div className="dashboard-grid">
        <StatCard label="Open Requests" value={requests.filter((request) => request.status !== "closed").length} />
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Reviews" value={reviews.length} />
        <StatCard label="Tutor" value={currentUser.name.split(" ")[0] || "Active"} />
      </div>

      <RequestsCard requests={requests} updateRequestStatus={updateRequestStatus} />

      <div className="grid-2">
        <div className="card">
          <h3>Course Catalog</h3>
          <div className="list">
            {courses.map((course) => (
              <div className="list-item" key={course.id}>
                <strong>{course.title}</strong> <span className="muted">({course.category})</span>
                <p>{course.description}</p>
              </div>
            ))}
          </div>
        </div>
        <ReviewsReadOnlyCard reviews={reviews} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RequestsCard({
  requests,
  updateRequestStatus
}: {
  requests: { id: string; name: string; serviceType: string; status: "new" | "replied" | "closed"; message: string }[];
  updateRequestStatus: (requestId: string, status: "replied" | "closed") => void;
}) {
  return (
    <div className="card">
      <h3>Incoming Requests</h3>
      {requests.length ? (
        [...requests].reverse().map((request) => (
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
  );
}

function ManageCoursesCard({
  courses,
  courseCategories,
  onAdd,
  onDelete
}: {
  courses: Course[];
  courseCategories: string[];
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
  onDelete: (courseId: string) => void;
}) {
  return (
    <div className="card">
      <h3>Manage Courses</h3>
      <form onSubmit={onAdd}>
        <label>Title<input name="title" required /></label>
        <label>Category
          <select name="category" required>
            {courseCategories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>Topics/Description<textarea name="description" rows={3} required /></label>
        <button className="primary" type="submit">Add Course</button>
      </form>
      <div className="list">
        {courses.map((course) => (
          <div className="list-item" key={course.id}>
            <strong>{course.title}</strong> <span className="muted">({course.category})</span>
            <p>{course.description}</p>
            <button className="danger" type="button" onClick={() => onDelete(course.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsCard({
  reviews,
  handleAddReview,
  deleteReview
}: {
  reviews: Review[];
  handleAddReview: (e: FormEvent<HTMLFormElement>) => void;
  deleteReview: (reviewId: string) => void;
}) {
  return (
    <div className="card">
      <h3>Manage Reviews</h3>
      <form onSubmit={handleAddReview}>
        <label>Name/Initials<input name="name" required /></label>
        <label>Rating (1-5)<input name="rating" type="number" min={1} max={5} required /></label>
        <label>Review<textarea name="text" rows={2} required /></label>
        <button className="primary" type="submit">Add Review</button>
      </form>
      <div className="list">
        {reviews.map((review) => (
          <div className="list-item" key={review.id}>
            <strong>{review.name}</strong> {stars(Number(review.rating))}
            <p>{review.text}</p>
            <button className="danger" type="button" onClick={() => deleteReview(review.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsReadOnlyCard({ reviews }: { reviews: Review[] }) {
  return (
    <div className="card">
      <h3>Student Reviews</h3>
      <div className="list">
        {reviews.length ? reviews.map((review) => (
          <div className="list-item" key={review.id}>
            <strong>{review.name}</strong> {stars(Number(review.rating))}
            <p>{review.text}</p>
          </div>
        )) : (
          <p className="muted">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

function FaqCard({
  faq,
  handleAddFaq,
  deleteFaq
}: {
  faq: FaqItem[];
  handleAddFaq: (e: FormEvent<HTMLFormElement>) => void;
  deleteFaq: (faqId: string) => void;
}) {
  return (
    <div className="card">
      <h3>Manage FAQ</h3>
      <form onSubmit={handleAddFaq}>
        <label>Question<input name="question" required /></label>
        <label>Answer<textarea name="answer" rows={2} required /></label>
        <button className="primary" type="submit">Add FAQ</button>
      </form>
      <div className="list">
        {faq.map((item) => (
          <div className="list-item" key={item.id}>
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
            <button className="danger" type="button" onClick={() => deleteFaq(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
