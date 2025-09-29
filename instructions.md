# ResumeForge AI - Project Instructions

This document outlines the architecture, setup, and guidelines for building **ResumeForge AI** using the Gemini API for AI generation, NeonDB for the database, and a decoupled frontend/backend structure.

---

## 1. Vision & Core Features

**Mission:** Empower job seekers by instantly tailoring their application materials to specific job descriptions, increasing their chances of landing an interview.

### Free Tier:
- User submits a job description and their resume text.  
- Receive AI-generated analysis with key skills to add and basic rewrite suggestions.  
- Ability to copy the suggested text.  

### Premium Tier (Paywall):
- Full generation of a tailored resume based on user info.  
- Generation of a personalized cover letter.  
- Ability to apply the generated content to professional resume templates.  
- Download the final document as a PDF.  

---

## 2. Branding & Design System

**Vibe:** Modern, trustworthy, professional, clean.  
**Primary Font:** Inter (Google Fonts).  

**Color Palette:**
- Primary Action: `#2563EB` (Blue 600)  
- Background: `#F8FAFC` (Slate 50)  
- Text: `#0F172A` (Slate 900)  
- Borders & Dividers: `#E2E8F0` (Slate 200)  
- Gradient: `from #3B82F6 (Blue 500) to #60A5FA (Blue 400)`  

---

## 3. Architecture & Tech Stack

This project uses a **decoupled (headless) architecture** with separate front-end and back-end repos.

### Frontend (Next.js)
- Framework: Next.js 14+ (App Router)  
- Language: TypeScript  
- Styling: Tailwind CSS  
- UI Components: shadcn/ui  
- GraphQL Client: Apollo Client  
- State Management: Zustand  
- Hosting: Vercel  

### Backend (Django)
- Framework: Django + Graphene-Django  
- API: GraphQL  
- Database: NeonDB (Postgres)  
- ORM: Django ORM  
- Async Tasks: Celery + RabbitMQ  
- Authentication: JWT  
- Hosting: Railway or Heroku  

### AI Integration
- **Gemini API** for resume and cover letter generation.  

---

## 4. Environment Variables

```env
# AI (Gemini)
GEMINI_API_KEY=AIzaSyCe8_sRp_ksIJu8ig-VzdRt-JandxeZyUk

# Database (NeonDB)
DATABASE_URL=postgresql://neondb_owner:npg_K2d1QmeFsGWL@ep-winter-water-a89l9tln-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require

# Auth
JWT_SECRET=your_jwt_secret_here

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

---

## 5. Data Flow & System Logic

1. **User Action (Frontend):** User submits job description + resume.  
2. **API Request:** Sent to Django backend via GraphQL mutation.  
3. **Task Delegation:** Backend creates AnalysisJob record → pushes task to RabbitMQ → returns job_id.  
4. **Async Processing:** Celery worker calls Gemini API → updates job with COMPLETED status.  
5. **Polling:** Frontend polls GraphQL query for job status until COMPLETED.  
6. **Results Displayed:** Resume + cover letter shown to user (Free vs Premium features apply).  

---

## 6. Page Flow

- `/` Landing Page – Hero + CTA.  
- `/auth` Login/Signup.  
- `/app` Main tool with Job Description + Resume input.  
- `/results/{job_id}` Results page with free vs premium views.  
- `/pricing` Pricing plans (Stripe Checkout).  

---

## 7. Project Structure

```
ResumeForgeAI/
│── frontend/   # Next.js App
│── backend/    # Django API
│── instructions.md
```

---

## 8. Next Steps

1. Scaffold **frontend** with Next.js + Tailwind + shadcn/ui.  
2. Scaffold **backend** with Django + GraphQL.  
3. Configure NeonDB + RabbitMQ.  
4. Connect Gemini API for AI text generation.  
5. Implement free tier → premium tier logic.  


Ask for my input at whatever point
