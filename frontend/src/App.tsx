import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Existing pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumesPage } from './pages/ResumesPage';
import { InterviewSetupPage } from './pages/InterviewSetupPage';
import { BlueprintPreviewPage } from './pages/BlueprintPreviewPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ReportPage } from './pages/ReportPage';
import { PracticePage } from './pages/PracticePage';
import { LiveContextPage } from './pages/LiveContextPage';

// New MCQ pages
import { MCQPracticePage } from './pages/MCQPracticePage';
import { MockInterviewPage } from './pages/MockInterviewPage';


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>

        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">

          {/* Navbar */}
          <Navbar />

          {/* Main Application */}
          <main className="flex-1">

            <Routes>

              {/* =========================================
                  PUBLIC ROUTES
              ========================================= */}

              <Route
                path="/"
                element={<LandingPage />}
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route
                path="/register"
                element={<RegisterPage />}
              />


              {/* =========================================
                  PROTECTED ROUTES
              ========================================= */}

              <Route element={<ProtectedRoute />}>

                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={<DashboardPage />}
                />

                {/* Resumes */}
                <Route
                  path="/resumes"
                  element={<ResumesPage />}
                />

                {/* Interview Setup */}
                <Route
                  path="/setup"
                  element={<InterviewSetupPage />}
                />

                {/* Blueprint */}
                <Route
                  path="/blueprint/:id"
                  element={<BlueprintPreviewPage />}
                />

                {/* Live Interview */}
                <Route
                  path="/interview/:id"
                  element={<InterviewRoomPage />}
                />

                {/* Interview Report */}
                <Route
                  path="/reports/:id"
                  element={<ReportPage />}
                />

                {/* Practice */}
                <Route
                  path="/practice"
                  element={<PracticePage />}
                />

                {/* =====================================
                    LIVE CONTEXT
                ===================================== */}

                <Route
                  path="/live-context"
                  element={<LiveContextPage />}
                />


                {/* =====================================
                    NEW: MCQ PRACTICE
                ===================================== */}

                <Route
                  path="/mcq-practice"
                  element={<MCQPracticePage />}
                />


                {/* =====================================
                    NEW: MOCK INTERVIEW
                ===================================== */}

                <Route
                  path="/mock-interview"
                  element={<MockInterviewPage />}
                />

              </Route>


              {/* =========================================
                  FALLBACK
              ========================================= */}

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />

            </Routes>

          </main>

        </div>

      </BrowserRouter>
    </AuthProvider>
  );
};


export default App;