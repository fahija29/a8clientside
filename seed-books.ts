import { sampleBooks } from './src/lib/books';

async function seedBooks() {
try {
const response = await fetch('http://localhost:8000/books/bulk', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(sampleBooks),
});


    const data = await response.json();

    console.log('Seed Result:', data);
} catch (error) {
    console.error('Failed to insert books:', error);
}


}

seedBooks();
