# 🎓 SmartTutor AI

> **An AI-powered personalized learning dashboard for students & professionals**
> 
> 🏆 Hackathon 2026 · Theme: **AI Super Productivity Tools**

---

## 📌 Problem Statement

In today's fast-paced world, both students and working professionals struggle to study and upskill efficiently. Traditional learning methods are one-size-fits-all — they don't adapt to individual pace, highlight weak areas, or keep learners motivated. The result? People spend hours studying but retain little, have no clear sense of progress, and give up before reaching their goals.

---

## 💡 Solution Overview

**SmartTutor AI** is an intelligent learning dashboard that acts as your personal AI tutor — generating custom mock tests, answering your questions with step-by-step reasoning, tracking your subject mastery in real time, and keeping you motivated with streaks and rewards.

Whether you're a student cramming for exams or a professional upskilling on the go, SmartTutor AI adapts to your pace and helps you learn smarter, not harder.

---

## 🏗️ Architecture

The system is built in 5 layers:

```
[ User ] 
    ↓  HTTP Requests
[ Frontend Dashboard ]  ← React + Tailwind CSS
    ↓  REST API Calls
[ AI / Logic Engine ]   ← OpenAI GPT-4 API
    ↓  Read / Write
[ Backend ]             ← Node.js / FastAPI
    ↓  Queries / Writes
[ Data Store ]          ← Firebase / MongoDB
```

<img src="architecture-diagram.png" alt="SmartTutor AI Architecture" width="100%"/>

> 💡 For the full interactive version, see [`architecture-diagram.html`](./architecture-diagram.html)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 AI Chat Tutor | Ask any question and get step-by-step explanations powered by GPT-4 |
| 📝 Mock Test Generator | Auto-generates custom quizzes by subject, topic & difficulty level |
| 📊 Progress Tracker | Visual mastery charts showing your performance per subject |
| 🧠 Recommendation Engine | Suggests next topics to study based on your weak areas |
| 🏆 Rewards & Streaks | Badges, XP points & daily streaks to keep you motivated |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Chart.js |
| Backend | Node.js / FastAPI |
| AI Engine | OpenAI GPT-4 API |
| Database | Firebase / MongoDB |
| Deployment | Vercel / Replit |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- OpenAI API Key
- Firebase account (or MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/BWT_codex-darshan-.git

# Navigate into the project
cd BWT_codex-darshan-

# Install dependencies
npm install

# Add your environment variables
cp .env.example .env
# → Add your OPENAI_API_KEY in the .env file

# Start the development server
npm run dev
```

---

## 👥 Team

**Team Name:** codex-darshan
**Hackathon:** BWT Hackathon 2026
**Theme:** AI Super Productivity Tools

---

## 📁 Repository Structure

```
BWT_codex-darshan-/
├── architecture-diagram.html   # Interactive system architecture diagram
├── architecture-diagram.png    # Architecture diagram image
├── README.md                   # Project overview (you are here)
├── src/
│   ├── components/             # React UI components
│   ├── pages/                  # Dashboard pages
│   └── api/                    # Backend API routes
├── public/                     # Static assets
└── .env.example                # Environment variable template
```

---

## 🎯 Demo Flow

1. User selects a **subject** from the sidebar
2. Opens **AI Chat** and asks a question → gets step-by-step explanation
3. Clicks **"Generate Mock Test"** → receives 5 custom questions
4. Submits answers → gets instant score + feedback
5. **Progress chart updates** → badge awarded if milestone reached
