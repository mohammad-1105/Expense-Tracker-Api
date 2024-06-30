# Expense Tracker API

## Overview

The Expense Tracker API allows users to manage their expenses with functionalities including user authentication, expense categorization. The API supports various operations such as adding, updating, and deleting expenses, as well as advanced features like JWT-based authentication.

![Diagram](/public/expense-tracker-api-diagram.png)

## Features

- User Authentication (Register, Login, Logout, JWT Authentication)
- Expense Management (Add, Update, Delete, List Expenses)
- Predefined Categories (Groceries, Leisure, Electronics, Utilities, Clothing, Health, Others)
- Email Verification
- Password Reset Functionality

## Technology Stack

- **Backend Framework**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Validation**: Zod
- **Email Service**: Nodemailer
- **Error Handling**: Custom Middleware

## Installation

1. Clone the repository:
```bash
https://github.com/mohammad-1105/Expense-Tracker-Api
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory and add the following environment variables:

```env
PORT=8000
MONGODB_URI=
DOMAIN=http://localhost:8000
CORS_ORIGIN=

NODE_ENV=development

################### ENV VARS FOR SECRET TOKENS ############################
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_SECRET_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_SECRET_EXPIRY=

############################ ENV VARS FOR NODEMAILER MAIL SENDING #######################################
GMAIL_SERVICE=
GMAIL_HOST=
GMAIL_PORT=
GMAIL_SECURE=
GMAIL_USER=example@gmail.com
GMAIL_PASS=your_app_password

```

4. Start the server

```bash
npm start
```

### Author
Mohammad Aman

Feel free to contribute and raise issues. Happy coding!