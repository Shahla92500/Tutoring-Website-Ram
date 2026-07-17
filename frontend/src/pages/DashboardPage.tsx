import { FormEvent, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { stars } from "../lib/format";
import type { Course, FaqItem, Review, SelectableOptionKey } from "../types";

const optionGroupLabels: Record<SelectableOptionKey, string> = {
  contactMethods: "Contact Methods",
  serviceTypes: "Tutoring Service Types",
  urgencyWindows: "Exam Urgency Windows",
  urgencyFlags: "Urgency Choices",
  assessmentSubjects: "Assessment Subjects",
  courseCategories: "Course Categories"
};

const optionGroupKeys = Object.keys(optionGroupLabels) as SelectableOptionKey[];

export default function DashboardPage() {
  const {
    db,
    currentUser,
    updateRequestStatus,
    addCourse,
    deleteCourse,
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

  const myRequests = currentUser ? db.requests.filter((r) => r.userId === currentUser.id) : [];

  function handleAddCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "tutor")) return;
    const fd = new FormData(e.currentTarget);
    addCourse({
      title: String(fd.get("title") ?? ""),
      category: String(fd.get("category") ?? "University Courses") as Course["category"],
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

  return (
    <section data-page="dashboard" className="page">
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
            <form onSubmit={handleAddCourse}>
              <label>Title<input name="title" required /></label>
              <label>Category
                <select name="category" required>
                  {db.selectableOptions.courseCategories.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
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
            <form onSubmit={handleAddReview}>
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
            <>
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

              <div className="card">
                <h3>Manage FAQ (Admin Only)</h3>
                <form onSubmit={handleAddFaq}>
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
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
