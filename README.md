<div align="center">

# 🎯 AI Interview Simulator

### Prepare smarter. Practice with purpose. Interview with confidence.

An AI-powered interview preparation platform that combines resume-aware interview preparation, multi-round mock interviews, instant AI feedback, skill-focused practice drills, MCQ practice, and company-role research in one workspace.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_App-635BFF?style=for-the-badge)](https://ai-interview-simulator2.netlify.app/)
[![API](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://ai-interview-simulator2.onrender.com/docs)
[![Frontend](https://img.shields.io/badge/Frontend-React_%2B_TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/PradeepChaudhari-ctrl/AI-Interview-Simulator2)

**[Launch the app](https://ai-interview-simulator2.netlify.app/) · [Explore the API](https://ai-interview-simulator2.onrender.com/docs) · [Report a bug](https://github.com/PradeepChaudhari-ctrl/AI-Interview-Simulator2/issues)**

</div>

---

## ✨ What it does

AI Interview Simulator helps candidates move from preparation to measurable practice. Create an account, add a resume, prepare for a target role, complete mock interviews, review feedback, and strengthen weak areas with focused drills.

## 🚀 Key features

- **Resume-based preparation** — upload a resume and use the extracted profile as part of your preparation workflow.
- **Adaptive interview blueprint** — generate a structured, multi-round interview plan for your target role.
- **Mock interview workspace** — answer interview questions in a dedicated interview session.
- **AI evaluation and reports** — review feedback and interview performance after completing a session.
- **Focused practice drills** — generate short practice sessions around a topic, then submit answers for AI feedback.
- **MCQ practice** — practise multiple-choice interview questions through a separate practice flow.
- **Live company and role context** — explore company information, relevant technologies, role expectations, and interview topics.
- **Practice history and dashboard** — revisit sessions and track your preparation workflow.
- **Responsive interface** — use the application on desktop and mobile-sized screens.

> AI-generated features require a valid Gemini API key on the backend. Results may depend on model availability, API quotas, and network connectivity.

## 🧰 Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Lucide icons |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| AI | Google Gemini API |
| Database | SQLite by default; PostgreSQL can be configured |
| Deployment | Netlify (frontend), Render (backend) |

## 🗺️ Application flow

1. Register and sign in.
2. Upload a resume or review your profile.
3. Select a target role and generate an interview blueprint.
4. Start an interview and answer the questions.
5. Complete the session and review the report and feedback.
6. Use focused practice drills or MCQs to work on areas that need improvement.
7. Explore company-role context before your next interview.

## 🌐 Live deployment

- **Web app:** https://ai-interview-simulator2.netlify.app/
- **Backend API:** https://ai-interview-simulator2.onrender.com
- **Interactive API docs:** https://ai-interview-simulator2.onrender.com/docs
- **Health endpoint:** https://ai-interview-simulator2.onrender.com/api/health

**Deployment note:** The backend is hosted on Render's free tier, so the first request after inactivity may take longer while the service wakes up.

## 💻 Run locally

### Prerequisites

- Python 3.10 or newer
- Node.js compatible with the installed Vite version (Node.js 20.19+ or 22.12+ recommended)
- npm
- A Google Gemini API key for AI-powered features

### 1. Clone the repository

```bash
git clone https://github.com/PradeepChaudhari-ctrl/AI-Interview-Simulator2.git
cd AI-Interview-Simulator2
```

### 2. Configure the backend

Create and activate a virtual environment, then install dependencies.

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

**Windows PowerShell**

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and configure at least:

```dotenv
SECRET_KEY=replace-with-a-private-random-secret-at-least-32-characters
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

Keep API keys and secrets private. **Never commit `backend/.env` or publish API keys in screenshots, issues, or README files.** The default database uses SQLite and its tables are created when the backend starts.

Start the backend from the repository root:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URLs:

- API: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` if needed and set the local backend URL:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Then run:

```bash
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

### 4. Build for production

From the `frontend` directory:

```bash
npm run build
```

The production frontend files are generated in `frontend/dist`.

## ⚙️ Environment variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Primary Gemini API key used by AI features |
| `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4` | Optional additional configured keys |
| `GEMINI_API_KEYS` | Optional comma-separated list of additional unique keys |
| `GEMINI_MODEL` | Main Gemini model name |
| `GEMINI_FAST_MODEL` | Model configured for faster tasks |
| `GEMINI_FALLBACK_MODEL` | Fallback model used for eligible temporary failures |
| `SECRET_KEY` | Private application signing/security secret; use at least 32 characters |
| `DATABASE_URL` | Database connection string; SQLite is the default |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `MAX_UPLOAD_MB` | Maximum resume upload size in MB (default: 10) |
| `UPLOAD_DIR` | Directory used for uploaded files |
| `CONTEXT_DEV_API_KEY` | Optional key for the configured Context.dev integration |
| `CONTEXT_DEV_MODE` | Mode setting for the Context.dev integration |

Set production values in your hosting provider's environment-variable settings, not in committed source files. For the deployed frontend, `VITE_API_URL` should point to `https://ai-interview-simulator2.onrender.com` without an extra `/api` suffix.

## 🔐 Security and privacy notes

- Keep Gemini and other API keys on the backend; do not expose them as frontend `VITE_*` variables.
- Use a unique, private `SECRET_KEY` in production.
- Restrict `CORS_ORIGINS` to the frontend origins you trust.
- Do not commit `.env` files, credentials, uploaded resumes, or personal interview data.
- Review your hosting provider's data retention and privacy settings before using real candidate information.

## 🧪 Troubleshooting

- **AI request fails or returns a quota error:** verify the backend's Gemini key, model access, quota, and billing settings.
- **The first backend request is slow:** a free Render service may need time to wake after inactivity.
- **Frontend cannot reach the API:** verify `VITE_API_URL`, backend availability, and the backend's `CORS_ORIGINS` setting; redeploy the frontend after changing build environment variables.
- **A direct page refresh shows a 404:** verify that the Netlify SPA redirect configuration is deployed.
- **Resume upload fails:** check the file type, upload size limit, and backend logs.

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make and test your changes.
4. Commit your work: `git commit -m "Describe your change"`.
5. Push the branch and open a pull request.

For bugs, include steps to reproduce, expected behavior, actual behavior, and relevant redacted logs. Do not include API keys, passwords, tokens, or personal data.

## 🗺️ Roadmap ideas

- Add more interview templates for different roles and experience levels.
- Improve progress visualizations across interview sessions.
- Expand automated tests for core interview and practice flows.
- Add accessible keyboard and screen-reader refinements.

## 👤 Maintainer

**Pradeep Chaudhari**  
GitHub: [@PradeepChaudhari-ctrl](https://github.com/PradeepChaudhari-ctrl)

## 📄 License

No license is currently specified in this repository. If you plan to accept contributions or allow reuse, add a `LICENSE` file with the license you choose.

---

<div align="center">

**If this project helps you prepare, consider giving the repository a ⭐ on GitHub.**

[Repository](https://github.com/PradeepChaudhari-ctrl/AI-Interview-Simulator2) · [Live App](https://ai-interview-simulator2.netlify.app/) · [API Docs](https://ai-interview-simulator2.onrender.com/docs)

</div>
