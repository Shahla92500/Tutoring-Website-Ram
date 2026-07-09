export interface Project {
		username: { type: String, required: true, unique: true, trim: true },
		firstname: { type: String, trim: true },
		lastname: { type: String, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [/.+@.+\..+/, "Must match an email address!"]
		}
}
