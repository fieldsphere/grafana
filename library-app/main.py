from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()


class BookResponse(BaseModel):
    title: str
    author: str
    year: int
    genre: str


class ItemResponse(BaseModel):
    id: str
    name: str


BOOKS: list[BookResponse] = [
    BookResponse(title="The Pragmatic Programmer", author="Hunt & Thomas", year=1999, genre="Technology"),
    BookResponse(title="Dune", author="Frank Herbert", year=1965, genre="Science Fiction"),
    BookResponse(title="Pride and Prejudice", author="Jane Austen", year=1813, genre="Classic"),
]

ITEMS: list[ItemResponse] = [
    ItemResponse(id="1", name="Reading Lamp"),
    ItemResponse(id="2", name="Bookmark Set"),
    ItemResponse(id="3", name="Library Card Holder"),
]


@app.get("/api/books", response_model=list[BookResponse])
def get_books():
    return BOOKS


@app.get("/api/items", response_model=list[ItemResponse])
def get_items():
    return ITEMS


app.mount("/", StaticFiles(directory="static", html=True), name="static")
