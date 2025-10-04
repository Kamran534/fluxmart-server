# GraphQL Test Queries

## Server Setup
- **Single Server**: Express + Apollo GraphQL running on port 8000
- **GraphQL Endpoint**: `http://localhost:8000/graphql`
- **REST Endpoint**: `http://localhost:8000/`

## Test Queries

### 1. Get All Books
```graphql
query GetBooks {
  books {
    title
    author
  }
}
```

### 2. Get Book Titles Only
```graphql
query GetBookTitles {
  books {
    title
  }
}
```

### 3. Get Authors Only
```graphql
query GetAuthors {
  books {
    author
  }
}
```

## How to Test

### Option 1: Using GraphQL Playground
1. Start the server: `npm run dev`
2. Open browser: `http://localhost:8000/graphql`
3. Use the queries above in the playground

### Option 2: Using curl
```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query GetBooks { books { title author } }"}'
```

### Option 3: Using fetch in browser console
```javascript
fetch('http://localhost:8000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query GetBooks { books { title author } }'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Expected Response
```json
{
  "data": {
    "books": [
      {
        "title": "The Awakening",
        "author": "Kate Chopin"
      },
      {
        "title": "City of Glass",
        "author": "Paul Auster"
      }
    ]
  }
}
```
