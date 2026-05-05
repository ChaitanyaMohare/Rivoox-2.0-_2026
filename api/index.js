import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level above /backend)
dotenv.config({ path: resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import dbCheck from "./middlewares/dbCheck.js";

const app = express();

app.use(dbCheck);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
    envLoaded: !!process.env.SUPABASE_URL
  });
});

import studentRoutes from './routes/students.js'
import authRoutes from './routes/auth.js'
import directorRoutes from "./routes/director.js";
import hodRoutes from "./routes/hod.js"
import classTeacherRoutes from "./routes/classTeacherRoutes.js"
import facultyRoutes from "./routes/faculty.js"
import defaulterRoutes from "./routes/defaulter.js"
import submissionRoutes from "./routes/submissionRoute.js"
import exportRoutes from "./routes/exportRoutes.js"

app.use('/api/students', studentRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/director", directorRoutes);
app.use("/api/hod", hodRoutes)
app.use("/api/class-teacher", classTeacherRoutes)
app.use("/api/faculty", facultyRoutes)
app.use("/api/defaulter/", defaulterRoutes)
app.use("/api/submissions/", submissionRoutes)
app.use("/api/export", exportRoutes);

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;