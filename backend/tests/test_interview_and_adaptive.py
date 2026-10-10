import json
import pytest

def test_full_interview_and_practice_lifecycle(client):
    # 1. Register candidate
    reg_res = client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": "sarah@cyberdyne.com",
        "password": "Password123!"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload text resume
    file_content = b"""Sarah Connor
Full Stack Engineer
Skills: Python, TypeScript, React, PostgreSQL, Docker, Redis
Projects:
1. Autonomous Dispatch Platform: Built distributed worker queue handling 50k jobs/min.
2. Analytics Dashboard: Real-time telemetry reporting using WebSockets and React.
Education: B.S. in Computer Science
"""
    upload_res = client.post(
        "/api/resumes",
        files={"file": ("sarah_resume.txt", file_content, "text/plain")},
        headers=headers
    )
    assert upload_res.status_code == 201
    resume_data = upload_res.json()
    resume_id = resume_data["id"]
    assert "skills" in resume_data["parsed_profile"]

    # 3. Generate blueprint
    bp_res = client.post(
        "/api/blueprints",
        json={
            "target_role": "Senior Full Stack Engineer",
            "resume_id": resume_id,
            "template_type": "software_developer",
            "experience_level": "Senior"
        },
        headers=headers
    )
    assert bp_res.status_code == 201
    bp_data = bp_res.json()
    blueprint_id = bp_data["id"]
    rounds = bp_data["blueprint"]["rounds"]
    assert len(rounds) >= 2

    # 4. Start interview session
    session_res = client.post(
        "/api/interviews",
        json={
            "blueprint_id": blueprint_id,
            "mode": "text"
        },
        headers=headers
    )
    assert session_res.status_code == 201
    session_data = session_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "in_progress"
    assert session_data["current_question"] is not None

    q1 = session_data["current_question"]
    assert q1["id"] is not None
    assert len(q1["question_text"]) > 10

    # 5. Submit answer for Question 1
    ans_res = client.post(
        f"/api/questions/{q1['id']}/answer",
        json={
            "text_answer": "In our distributed queue, we used Redis Streams with consumer groups to achieve at-least-once delivery, and PostgreSQL transactions with optimistic concurrency control to prevent double processing.",
            "duration_seconds": 45.0,
            "mode": "text"
        },
        headers=headers
    )
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert ans_data["evaluation"]["score"] >= 0
    assert "strengths" in ans_data["evaluation"]

    # 6. Fetch next adaptive question
    next_q_res = client.post(
        f"/api/interviews/{session_id}/next-question",
        headers=headers
    )
    assert next_q_res.status_code == 200
    q2 = next_q_res.json()
    assert q2 is not None
    assert q2["id"] != q1["id"]

    # 7. Complete the interview session
    comp_res = client.post(
        f"/api/interviews/{session_id}/complete",
        headers=headers
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"

    # 8. Generate Readiness Report
    rep_res = client.get(
        f"/api/reports/{session_id}",
        headers=headers
    )
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert "overall_metrics" in rep_data
    assert rep_data["overall_metrics"]["readiness_score"] >= 0
    assert len(rep_data["practice_plan"]) >= 1

    practice_topic = rep_data["practice_plan"][0]["topic"]

    # 9. Start weakness-based practice drill
    prac_res = client.post(
        "/api/practice",
        json={
            "topic": practice_topic,
            "source_report_id": rep_data["id"],
            "target_role": "Senior Full Stack Engineer"
        },
        headers=headers
    )
    assert prac_res.status_code == 201
    prac_data = prac_res.json()
    assert len(prac_data["questions"]) >= 1

    practice_id = prac_data["id"]
    pq1 = prac_data["questions"][0]

    # 10. Answer practice drill question
    p_ans_res = client.post(
        f"/api/practice/{practice_id}/answer",
        json={
            "question_id": pq1["id"],
            "answer_text": "To prevent split-brain and race conditions in concurrent workers, we use distributed locks with leases and fencing tokens."
        },
        headers=headers
    )
    assert p_ans_res.status_code == 200
    p_ans_data = p_ans_res.json()
    assert len(p_ans_data["answers"]) == 1
    assert p_ans_data["answers"][0]["score"] >= 0

    # 11. Verify practice history
    hist_res = client.get("/api/practice/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1
