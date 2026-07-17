import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";

export default function CoursesPage() {
  const { db } = useAppContext();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const categories = useMemo(() => ["All", ...db.selectableOptions.courseCategories], [db.selectableOptions.courseCategories]);

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

  return (
    <section data-page="courses" className="page">
      <h2>Courses</h2>
      <p className="muted">Filter by category and select a course to view topics covered.</p>
      <div className="filters">
        <label>
          Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
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
  );
}
