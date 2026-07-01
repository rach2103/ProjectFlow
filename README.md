# 🚀 Full-Stack Project Management System (PMS)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)

A powerful, robust, and scalable **Project Management System** designed to streamline workflows, enhance team collaboration, and track project health from a single pane of glass. Built with the modern MERN stack and strictly typed using TypeScript.

---

## 🌟 Comprehensive Feature Set

### 🗂️ Project & Task Management
- **Workspaces & Projects:** Create distinct workspaces and unlimited projects.
- **Task Tracking:** Granular task management with statuses, priorities, assignees, and deadlines.
- **Kanban & Lists:** Visualize tasks through dynamic, drag-and-drop Kanbans or structured lists.

### ⏱️ Time & Budget Tracking
- **Time Logs:** Track exactly how many hours your team spends on specific tasks.
- **Budget Health:** Set project budgets, track expenses, and monitor financial health in real-time.

### 💬 Seamless Collaboration
- **Real-Time Comments:** Communicate contextually directly within tasks.
- **Notifications:** In-app notification system to alert users about assignments, mentions, and due dates.

### 📊 Dashboards & Analytics
- **Personalized Dashboards:** View upcoming deadlines, assigned tasks, and overall progress at a glance.
- **Comprehensive Reports:** Generate visual reports on time allocation, budget burn rates, and team velocity.

### 📄 Document Management
- **Centralized Storage:** Upload and link crucial documents directly to projects and tasks.

---

## 💻 Technology Stack

### Frontend Architecture
- **Framework:** React 18
- **Build Tool:** Vite (for lightning-fast HMR and optimized builds)
- **Language:** TypeScript
- **Styling:** Material-UI (MUI v5)
- **Routing:** React Router v6
- **State Management / Data Fetching:** Context API & Custom Hooks

### Backend Architecture
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **File Storage:** Local uploads (configurable to Cloudinary/AWS S3)

---

## 📁 Repository Structure

This repository is a monorepo separated cleanly into client and server environments.

```text
ProjectFlow/
├── backend/                  # Node.js API Server
│   ├── src/
│   │   ├── controllers/      # Route logic (Auth, Projects, Tasks, etc.)
│   │   ├── models/           # Mongoose schemas (User, Task, Project, Expense, etc.)
│   │   ├── routes/           # Express API route definitions
│   │   ├── middleware/       # Custom middleware (Auth, Error handling, Validation)
│   │   ├── utils/            # Helper functions
│   │   └── server.ts         # Application entry point
│   ├── .env.example          # Example environment variables
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # Backend TypeScript configuration
│
└── frontend/                 # React Client Application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # View components (Auth, Dashboard, Projects, etc.)
    │   ├── services/         # API integration layer
    │   ├── contexts/         # Global state providers (Theme, Auth)
    │   └── types/            # TypeScript interfaces
    ├── index.html            # Vite HTML entry
    ├── package.json          # Frontend dependencies
    └── vite.config.ts        # Vite build configuration
```

---

## ⚙️ Local Development Setup

To run this project locally, you will need **Node.js** (v18+) and **MongoDB** installed on your machine.

### 1. Backend Configuration

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Install the required dependencies:
```bash
npm install
```

Create a `.env` file in the `backend` directory based on the example:
```bash
cp .env.example .env
```

**Required Environment Variables (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pms_database
JWT_SECRET=your_super_secret_jwt_key_here
```

Start the backend development server:
```bash
npm run dev
```
*The backend API will now be running on `http://localhost:5000`.*

### 2. Frontend Configuration

Open a **new** terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install the required dependencies:
```bash
npm install
```

Create a `.env` file in the `frontend` directory:
```bash
touch .env
```

**Required Environment Variables (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
*The React application will now be running on `http://localhost:5173`.*

---

## 🔐 Core API Endpoints (Overview)

| Method | Endpoint | Description | Requires Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Authenticate a user and receive JWT | ❌ |
| `GET` | `/api/projects` | Fetch all projects for the authenticated user | ✅ |
| `POST` | `/api/projects` | Create a new project | ✅ |
| `GET` | `/api/tasks` | Fetch tasks assigned to the user | ✅ |
| `POST` | `/api/timeLog` | Log time against a specific task | ✅ |
| `POST` | `/api/expense` | Record a project expense | ✅ |

*(Detailed API documentation can be generated using tools like Swagger/Postman.)*

---

## 🤝 Contributing

Contributions are always welcome! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📜 License

This project is open-source and available under the **MIT License**.
