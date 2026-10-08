CSE-VMS
Community Skills Exchange and Volunteer Management System

CSE-VMS is a web-based platform designed to connect community needs, skills, volunteers, coordinators, and administrators in one centralized system.

Key Features
Secure user authentication and role-based access control
Administrator dashboard and user management
Volunteer profile and skills management
Community needs management
Coordinator volunteer assignment
Activity and participation management
Notifications and feedback
Permission-based system access
MySQL database integration
RESTful API architecture
User Roles
Administrator
Coordinator
Volunteer
Community Member
Technologies
Node.js
Express.js
MySQL
HTML5
CSS3
JavaScript
JWT Authentication
bcrypt.js
dotenv
mysql2
Project Structure
CSE-VMS/
├── public/
│   ├── css/
│   ├── js/
│   └── *.html
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
Installation
1. Clone the repository

Clone this repository to your computer.

2. Install dependencies
npm install
3. Configure environment variables

Create a .env file in the project root and add your local database configuration.

Example:

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=cse_vms
PORT=3000
JWT_SECRET=your_jwt_secret
4. Start the application
node server.js
5. Open the application

Open your browser and visit:

http://127.0.0.1:3000
Security

Sensitive configuration files such as .env, database dumps, logs, and backup files are excluded from version control.

Do not upload real database passwords, JWT secrets, or other sensitive credentials to GitHub.

Author

Bernard NIYITANGUMISHA

Information Technology | Web Development | Database Management

Rwanda