# Elective Subject Selection System

A full-stack web application designed to manage the elective subject selection process for students. It features role-based access (Admin/Student), real-time seat availability, preference-based allocation, and analytics.

## 🚀 Features

### 🎓 Student Portal
*   **Dashboard**: View all available elective subjects with real-time seat counts.
*   **Smart Filtering**: Automatically hides/disables subjects based on the student's branch (Open Elective constraints).
*   **Preference System**: Rank subjects in order of preference (1st, 2nd, 3rd...).
*   **Real-time Allocation**: Immediate seat allocation based on submitted preferences and availability.
*   **Deadline Enforcement**: Selection is disabled automatically after the admin-configured deadline.

### 🛡️ Admin Dashboard
*   **Subject Management**: Create, edit, and delete subjects. Set seat limits and branch restrictions.
*   **Student Management**: Bulk upload students via CSV or add them manually.
*   **System Settings**:
    *   Set a global **Selection Deadline**.
    *   Toggle **Student Login** access (Enable/Disable portal).
*   **Analytics & Reports**:
    *   **Subject Popularity**: Bar charts showing total selections per subject.
    *   **Branch Distribution**: Stacked charts showing which branches are choosing which subjects.
    *   **CSV Export**: Download the final selection list for offline processing.

## 🛠️ Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Database**: SQLite (Dev) / PostgreSQL (Production)
*   **ORM**: Prisma
*   **Auth**: NextAuth.js (Credentials)
*   **Styling**: Tailwind CSS
*   **Charts**: Recharts

## 📂 Project Structure
*   `app/student`: Student-facing routes (Dashboard, Selection).
*   `app/admin`: Admin-facing routes (Subjects, Students, Analytics, Settings).
*   `app/api`: Backend API routes (Auth, Selection Logic, Data Export).
*   `prisma/schema.prisma`: Database models (User, Subject, Selection, Preference).

## ⚡ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push Schema to DB
npx prisma db push

# Seed Admin User (admin / admin123)
npx ts-node prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

## 🚀 Deployment (Vercel)
1.  Push code to **GitHub**.
2.  Import project in **Vercel**.
3.  Add **Vercel Postgres** storage.
4.  Update `prisma/schema.prisma` provider to `postgresql`.
5.  Deploy!
