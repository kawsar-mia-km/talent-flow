from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "TalentFlow AI Service"


def test_openapi_schema_is_served():
    # Cheap smoke test that the app wires up without import errors and
    # every router is mounted (docs route only exists if app booted clean).
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "TalentFlow AI Service"
