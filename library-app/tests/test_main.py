from starlette.testclient import TestClient

from main import app

client = TestClient(app)


def test_get_books():
    response = client.get("/api/books")
    assert response.status_code == 200
    books = response.json()
    assert isinstance(books, list)
    assert len(books) > 0
    assert set(books[0].keys()) == {"title", "author", "year", "genre"}


def test_get_items():
    response = client.get("/api/items")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0
    assert set(items[0].keys()) == {"id", "name"}
