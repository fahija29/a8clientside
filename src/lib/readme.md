# 📚 BookNook – A Small Online Library

BookNook is an online library management platform where users can explore books, add their own books, borrow books, and return borrowed books. The main goal of this project is to make book sharing and borrowing easier through a simple and user-friendly online platform.

**Live Website:** `YOUR_FRONTEND_VERCEL_URL`

**Backend API:** https://catron-backend.vercel.app

---

## 🎯 Project Purpose

The purpose of BookNook is to create a small online library where readers can:

* Explore books from different categories.
* Add new books to the library.
* Borrow available books for a limited period.
* Manage books they have added.
* View their borrowed books.
* Return borrowed books.

The project demonstrates how frontend, backend, database, and authentication systems work together in a full-stack web application.

---

## ✨ Key Features

* **User Authentication:** Users can register and log in using email and password.
* **Google Authentication:** Users can sign in using their Google accounts.
* **Book Collection:** Users can explore books from the library.
* **Add Books:** Logged-in users can add new books with details and images.
* **My Books:** Users can manage the books they have added.
* **Update & Delete:** Users can edit or delete their own books.
* **Borrow System:** Users can borrow available books.
* **My Borrows:** Users can view their borrowed books and return them.
* **User Profile:** Users can access their profile information.
* **Private Routes:** Protected pages require user authentication.
* **Responsive Design:** The interface is designed for desktop, tablet, and mobile devices.
* **Loading & Error Messages:** Users receive feedback during data loading and when requests fail.

---

## 🛠️ Technologies Used

### 1. Frontend

| Technology         | How It Is Used                                                   |
| ------------------ | ---------------------------------------------------------------- |
| Next.js            | Builds the frontend using the App Router and page-based routing. |
| React              | Creates reusable UI components and interactive interfaces.       |
| TypeScript         | Provides type safety and helps organize the application code.    |
| CSS / Tailwind CSS | Used for styling and responsive layouts, where configured.       |

### 2. Authentication & Security

| Technology      | How It Is Used                                                                         |
| --------------- | -------------------------------------------------------------------------------------- |
| Better Auth     | Handles user registration, login, sessions, and authentication.                        |
| MongoDB Adapter | Stores authentication data in MongoDB.                                                 |
| Google OAuth    | Allows users to authenticate using Google accounts.                                    |
| JWT             | Generates authentication tokens for secure communication between frontend and backend. |
| JWKS            | Allows the backend to obtain public keys to verify JWT tokens.                         |

### 3. Backend

| Technology             | How It Is Used                                               |
| ---------------------- | ------------------------------------------------------------ |
| Express.js             | Creates REST API endpoints and handles server requests.      |
| Node.js                | Runs the backend application.                                |
| MongoDB                | Stores books, borrowing information, and application data.   |
| MongoDB Node.js Driver | Connects the Express server to MongoDB.                      |
| CORS                   | Controls cross-origin requests between frontend and backend. |
| dotenv                 | Loads environment variables for server configuration.        |

### 4. Deployment

| Platform      | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| Vercel        | Hosts the frontend and backend applications.                |
| MongoDB Atlas | Provides cloud database storage.                            |
| GitHub        | Stores project source code and tracks development progress. |

---

## ⚙️ How the Technologies Work Together

### Frontend – Next.js

Next.js is used to build the user interface and manage application routes.

The App Router organizes different pages, such as Home, All Books, Add Book, My Books, and My Borrows.

React components make the interface interactive, while TypeScript helps maintain structured and reliable code.

### Authentication – Better Auth

Better Auth manages user authentication.

* Users can register with their name, email, and password.
* Users can log in using email and password.
* Google OAuth provides social login.
* MongoDB Adapter stores user and session information in MongoDB.
* Private pages require an authenticated session.

### Backend – Express.js

Express.js handles the application's REST API requests.

The frontend communicates with the backend to retrieve, create, update, and delete book information.

The backend also manages borrowing and returning operations.

### Database – MongoDB

MongoDB stores application data.

The application uses separate collections for different types of information:

* **Books:** Stores book details, author information, category, images, and availability.
* **Borrows:** Stores borrowing records, user information, and borrowing dates.
* **Authentication Collections:** Store user accounts, sessions, OAuth accounts, and authentication-related information.

### JWT Authentication

Better Auth generates JWT tokens using its JWT plugin.

The frontend sends the token when making protected API requests.

Express verifies the token using the corresponding public key through JWKS before allowing access to protected operations.

---

## 🔗 Backend API Routes
i used postman for checking

The Express backend provides the following REST API endpoints:

| Method | Endpoint       | Description                               |
| ------ | -------------- | ----------------------------------------- |
| GET    | `/books`       | Get all books.                            |
| GET    | `/books/:id`   | Get a single book.                        |
| POST   | `/books`       | Add a new book.                           |
| PATCH  | `/books/:id`   | Update a book.                            |
| DELETE | `/books/:id`   | Delete a book.                            |
| POST   | `/borrows`     | Borrow a book.                            |
| GET    | `/borrows`     | Get borrowed books of the logged-in user. |
| DELETE | `/borrows/:id` | Return a borrowed book.                   |

Protected operations require valid authentication.

---

## 📂 Main Application Routes

| Route         | Description                    | Access  |
| ------------- | ------------------------------ | ------- |
| `/`           | Home page                      | Public  |
| `/books`      | View all books                 | Public  |
| `/books/[id]` | View book details              | Private |
| `/add-book`   | Add a new book                 | Private |
| `/my-books`   | Manage added books             | Private |
| `/my-borrows` | View and return borrowed books | Private |
| `/login`      | User login                     | Public  |
| `/register`   | User registration              | Public  |

---

## 🔐 Environment Variables

Create a `.env.local` file in the frontend project root and configure the required environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=your_frontend_url

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Configure the required backend environment variables separately.

**Important:** Never upload real environment variables, database credentials, or secret keys to GitHub.

---

## 🚀 Getting Started

### Frontend Setup

Clone the frontend repository:

```bash
git clone YOUR_FRONTEND_GITHUB_REPOSITORY
```

Go to the project folder:

```bash
cd cat_ron
```

Install dependencies:

```bash
npm install
```

Configure the environment variables in `.env.local`.

Run the development server:

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

### Backend Setup

Clone the backend repository:

```bash
git clone YOUR_BACKEND_GITHUB_REPOSITORY
```

Go to the backend folder:

```bash
cd "cat_ron server"
```

Install dependencies:

```bash
npm install
```

Configure the backend environment variables.

Start the backend server using the configured npm script.

---

## 📱 Project Highlights

BookNook combines modern web technologies to demonstrate a complete full-stack library application.

The project focuses on:

* Full-stack application development.
* User authentication and authorization.
* REST API development.
* MongoDB database management.
* JWT-based API security.
* CRUD operations.
* Book borrowing and returning management.
* Responsive user interface design.

---

## 👩‍💻 Project Information

**Project Name:** BookNook – A Small Online Library

**Assignment:** Programming Hero – Assignment 8 (B14-A8-Cat_Ron)

**Project Type:** Full-Stack Web Application

**Frontend:** Next.js

**Backend:** Express.js

**Database:** MongoDB

**Authentication:** Better Auth & JWT

---

## 📄 License

This project was developed for educational purposes as part of a web development assignment.
