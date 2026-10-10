Acknowledgements

CSS Styling: ChatGPT was used as an AI assistance tool for CSS styling suggestions and UI refinements. The suggested styles were integrated and adapted to the project interface.

# Rating Web Application

A full-stack web application that allows users to rate stores, administrators to manage users and stores, and store owners to monitor customer ratings.

## Features

### System Administrator
- View dashboard statistics: total users, stores, and ratings.
- Create users with `USER`, `STORE_OWNER`, or `ADMIN` roles.
- Create stores and assign store owners.
- View and filter users by name, email, address, and role.
- View and filter stores by name, email, and address.
- Sort users and stores in ascending or descending order.
- View average store ratings and rating counts.
- View store owners' average ratings.

### Normal User
- Register and log in securely.
- Browse and search stores by name and address.
- View store details, overall ratings, and personal ratings.
- Submit a rating from 1 to 5.
- Update a previously submitted rating.
- Change password and log out.

### Store Owner
- Log in securely.
- View assigned stores.
- View average ratings and total ratings for each store.
- View users who rated their stores, including their ratings and update timestamps.
- Refresh dashboard data.
- Change password and log out.

### Validation and Security
- Name length: 20–60 characters.
- Address length: maximum 400 characters.
- Password length: 8–16 characters, including at least one uppercase letter and one special character.
- Email format validation and duplicate email prevention.
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based API authorization.
- Database constraints to prevent duplicate ratings by the same user for the same store.
- Environment variables for sensitive configuration.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Database Driver | mysql2 |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcryptjs |
| Validation | express-validator |
| Security Middleware | Helmet, CORS |
| API Testing | Postman |
| Version Control | Git, GitHub |

## Project Structure

```text
Rating_Web_App/
├── backend/
│   ├── scripts/
│   │   └── createAdmin.js
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env
│   └── package.json
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MySQL Server
- Git
- A code editor such as Visual Studio Code

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sumit4261/Rating_Web_App.git
cd Rating_Web_App
```

### 2. Set Up the MySQL Database

Start your MySQL server and open MySQL Workbench or SQL Server-compatible MySQL client software.

Create the database:

```sql
CREATE DATABASE roxiler_rating;
USE roxiler_rating;
```

Create the required `users`, `stores`, and `ratings` tables using the schema defined for the project. Ensure the schema includes:

- A unique email for each user.
- Roles: `ADMIN`, `USER`, and `STORE_OWNER`.
- A foreign key connecting stores to their owners.
- A foreign key connecting ratings to users and stores.
- A rating constraint restricting values to 1–5.
- A unique constraint on `(user_id, store_id)`.

### 3. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=roxiler_rating

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

Replace the database password and JWT secret with your own values. Never commit your `.env` file to GitHub.

### 4. Create the Administrator Account

Run the existing admin creation script:

```bash
node scripts/createAdmin.js
```

Follow the script's prompts or output to complete the process. Use the credentials configured for your administrator account to sign in.

### 5. Start the Backend

From the `backend/` directory:

```bash
npm run dev
```

The API should run at:

`http://localhost:5000`

If your backend does not define a `dev` script, check `backend/package.json` and use the available development or start script.

### 6. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not put database credentials or private JWT secrets in frontend environment variables.

### 7. Start the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a normal user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Get the current authenticated user |

### Administrator

All endpoints below require authentication and the `ADMIN` role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Retrieve dashboard statistics |
| POST | `/admin/users` | Create a user, store owner, or admin |
| GET | `/admin/users` | List, filter, and sort users |
| GET | `/admin/users/:id` | Retrieve user details |
| POST | `/admin/stores` | Create a store and assign an owner |
| GET | `/admin/stores` | List, filter, and sort stores |

### Stores

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stores` | Retrieve stores for the authenticated normal user, with search filters |

### Ratings

Ratings require authentication and the `USER` role.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ratings/:storeId` | Submit or update a store rating |

The rating must be an integer between 1 and 5. Submitting another rating for the same store updates the existing rating.

### Store Owner

The following endpoint requires authentication and the `STORE_OWNER` role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/owner/dashboard` | Retrieve assigned stores, rating summaries, and users who rated them |

### Password Management

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/password` | Change the authenticated user's password |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend health, if configured at that path |

Protected endpoints require an authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rating Logic

- Each rating belongs to one user and one store.
- Ratings are integers from 1 through 5.
- A user can have only one rating per store.
- The user can update the existing rating.
- The store's overall rating is calculated as the average of its submitted ratings.

## Testing

Test the following scenarios before submission:

1. Register and log in as a normal user.
2. Create users with each supported role through the administrator dashboard.
3. Create a store and assign a store owner.
4. Search and sort users and stores.
5. Submit a rating and update it.
6. Verify that average ratings and rating counts change correctly.
7. Log in as the store owner and verify that only assigned stores are shown.
8. Verify that protected API endpoints reject unauthenticated or unauthorized requests.
9. Test invalid passwords, duplicate emails, and ratings outside the 1–5 range.
10. Test password changes using both correct and incorrect current passwords.

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `NODE_ENV` | Runtime environment |
| `DB_HOST` | MySQL server hostname |
| `DB_PORT` | MySQL server port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration |
| `CLIENT_URL` | Frontend origin used by CORS |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

## Security Notes

- Store passwords as bcrypt hashes, never as plaintext.
- Keep backend secrets in environment variables.
- Never commit `.env` files, credentials, or database dumps containing private data.
- Validate user input on the server, even when frontend validation exists.
- Enforce role authorization on every protected backend endpoint.
- Use HTTPS and appropriate production configuration when deploying.

## Author

**Sumit Mane**

GitHub: [sumit4261](https://github.com/sumit4261)

Repository: [Rating Web App](https://github.com/sumit4261/Rating_Web_App)

---

*Developed as a full-stack store-rating web application assessment project.*
