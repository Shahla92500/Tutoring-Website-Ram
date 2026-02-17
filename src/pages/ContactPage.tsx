import { FormEvent, useState } from "react";
import { useAppContext } from "../context/AppContext";

export default function ContactPage() {
  const { submitContact } = useAppContext();
  const [feedback, setFeedback] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = submitContact({
      name: String(fd.get("name") ?? ""),
      contactMethod: String(fd.get("contactMethod") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      serviceType: String(fd.get("serviceType") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      urgencyWindow: String(fd.get("urgencyWindow") ?? ""),
      isUrgent: String(fd.get("isUrgent") ?? "No"),
      hardTopics: String(fd.get("hardTopics") ?? ""),
      preferredSlot: String(fd.get("preferredSlot") ?? ""),
      earliestDate: String(fd.get("earliestDate") ?? ""),
      message: String(fd.get("message") ?? ""),
      consultation: fd.get("consultation") === "on"
    });

    setFeedback(result.message);
    if (result.ok) e.currentTarget.reset();
  }

  return (
    <section data-page="contact" className="page">
      <h2>Contact / Booking Request</h2>
      <form id="contact-form" className="card" onSubmit={handleSubmit}>
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
        <p className="feedback">{feedback}</p>
      </form>
    </section>
  );
}
