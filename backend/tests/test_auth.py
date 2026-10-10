def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_register_and_login(client):
    # 1. Register
    reg_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePassword123!"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"
    token = data["access_token"]

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login success
    login_res = client.post("/api/auth/login", json={
        "email": "jane@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login wrong password should fail
    bad_login = client.post("/api/auth/login", json={
        "email": "jane@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 5. Access /me protected route
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Jane Doe"
