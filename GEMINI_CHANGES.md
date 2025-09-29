# Gemini CLI - Project Setup Summary

This document summarizes the initial setup and installations performed by the Gemini CLI for the ResumeForge AI project.

## 1. Project Scaffolding

- Created the `frontend/` directory.
- Created the `backend/` directory.

## 2. Frontend Setup

The user confirmed that Next.js 14+ (App Router) with TypeScript and Tailwind CSS was already set up in the `frontend/` directory, without using a `src` folder.

- **UI Components:** The user confirmed that `shadcn/ui` was already initialized.
- **GraphQL Client:** Installed `Apollo Client` and `graphql`.
- **State Management:** Installed `Zustand`.

## 3. Backend Reconstruction

After encountering persistent issues with Django's migration system, the backend was rebuilt from scratch to ensure a clean and functional foundation.

- **Project Re-initialization:**
    - The entire `backend/` directory was removed and recreated.
    - A new Python virtual environment (`venv`) was created.
    - Django (version 5.2.6) was installed.
    - A new Django project named `resumeforge_backend` was created.

- **App Creation:**
    - A new Django app named `api` was created to house all primary business logic, replacing the previous problematic `core` app.

- **Dependency Installation:** All necessary backend dependencies were installed, including:
    - `graphene-django`
    - `psycopg2-binary`
    - `celery`
    - `djangorestframework-simplejwt`
    - `dj-database_url`
    - `django-celery-results`
    - `google-generativeai`
    - `django-graphql-jwt`

- **Configuration:**
    - **Database:** Configured Django to connect to the NeonDB PostgreSQL database.
    - **Celery & RabbitMQ:** Configured Celery to use RabbitMQ as the message broker and `django-celery-results` for storing task outcomes.
    - **GraphQL API:**
        - Established the GraphQL schema structure with a root `schema.py` and an app-specific `api/schema.py`.
        - Configured the `/graphql` endpoint in the main `urls.py`.
    - **Gemini API:** Added the `GEMINI_API_KEY` to the project settings.
    - **Authentication:**
        - Configured `djangorestframework-simplejwt` for JWT authentication.
        - Added `rest_framework` and `rest_framework_simplejwt` to `INSTALLED_APPS`.
        - Added `graphql_jwt` to `INSTALLED_APPS` and configured `AUTHENTICATION_BACKENDS`.
        - Integrated JWT token endpoints (`token/`, `token/refresh/`, `token/verify/`) into `urls.py`.

- **AI Integration & Core Logic:**
    - **`AnalysisJob` Model:** Created a Django model to store the job description, resume text, analysis results, and job status. Added fields for `generated_resume` and `generated_cover_letter` for premium features.
    - **`Subscription` Model:** Created a model to store user subscription details, linked to the `User` model.
    - **Migrations:** Successfully created and applied the initial database migrations for `AnalysisJob` and `Subscription` models.
    - **Gemini Service:** Implemented a `gemini.py` module with functions for `generate_resume_analysis` (free tier), `generate_full_resume` (premium), and `generate_cover_letter` (premium).
    - **Async Task:** Created a Celery task in `api/tasks.py` to process resume analysis requests, now accepting flags for `generate_full_resume` and `generate_cover_letter`.
    - **GraphQL Mutation:** Implemented a `createAnalysisJob` mutation to accept user input, create an `AnalysisJob` record, and trigger the Celery task. This mutation now requires authentication and checks for premium subscription status before allowing premium features.
    - **GraphQL Query:** Implemented a `job` query to allow the frontend to poll for the status and results of an analysis job.
    - **User Authentication GraphQL:** Added `CreateUser` mutation, `UserType` (including `is_premium` and `subscription` fields), and `me` query to `api/schema.py` for user registration and fetching current user details. A default free subscription is created for new users.
    - **Mock Premium Upgrade:** Implemented a `UpgradeToPremium` GraphQL mutation in `api/schema.py` to simulate a premium subscription upgrade, setting the user's plan to 'PREMIUM' and `active_until` to 30 days in the future. Removed Stripe-related code and settings.

## 4. Frontend Development (Free Tier)

- **Landing Page (`/`):** Created a basic landing page with a hero section and a call-to-action button.
- **Main Application Page (`/app`):**
    - Implemented a form for users to input job descriptions and resume text.
    - Integrated `shadcn/ui` components (`Button`, `Textarea`, `Label`).
    - Configured Apollo Client for GraphQL communication.
    - Defined `CREATE_ANALYSIS_JOB` GraphQL mutation.
    - Implemented form submission to trigger the backend mutation and redirect to the results page.
- **Results Page (`/results/[job_id]`):
    - Created the dynamic results page to display job analysis status and results.
    - Defined `GET_ANALYSIS_JOB` GraphQL query.
    - Implemented polling mechanism to fetch job status updates from the backend.
    - Integrated `shadcn/ui` components (`Card`, `Skeleton`) for displaying results and loading states.

## 5. Frontend Development (Authentication)

- **Authentication Page (`/auth`):**
    - Created a dedicated page for user login and registration.
    - Integrated `shadcn/ui` components (`Card`, `Input`, `Button`, `Label`).
    - Defined `CREATE_USER` and `TOKEN_AUTH` GraphQL mutations.
    - Implemented form submission to handle user registration and login.
    - Integrated `Zustand` for client-side authentication state management.
    - Stored JWT access token in `localStorage` upon successful login/registration.
    - Redirected users to the `/app` page after successful authentication.
- **Apollo Client Integration:**
    - Modified `frontend/lib/apollo.ts` to include an `Apollo Link` that attaches the JWT access token to all outgoing GraphQL requests.

## 6. Backend Development (Premium Tier Logic)

- **`AnalysisJob` Model Extension:** Added `generated_resume` and `generated_cover_letter` fields to the `AnalysisJob` model to store premium content.
- **Gemini Service Enhancement:** Updated `api/gemini.py` with `generate_full_resume` and `generate_cover_letter` functions for premium AI generation.
- **Celery Task Update:** Modified `api/tasks.py` to accept `generate_full_resume_flag` and `generate_cover_letter_flag` to trigger premium content generation.
- **GraphQL Mutation Update:** Updated `createAnalysisJob` in `api/schema.py` to accept `generate_full_resume` and `generate_cover_letter` arguments. Implemented authorization checks to ensure only premium users can request these features.
- **Mock Premium Upgrade:** Implemented a `UpgradeToPremium` GraphQL mutation in `api/schema.py` to simulate a premium subscription upgrade, setting the user's plan to 'PREMIUM' and `active_until` to 30 days in the future. Removed Stripe-related code and settings.

## 7. Frontend Development (Premium Tier Logic)

- **Main Application Page (`/app`):**
    - Integrated `GET_ME` GraphQL query to fetch user's premium status.
    - Added UI elements (`Checkbox`) for `generateFullResume` and `generateCoverLetter` options.
    - Enabled premium checkboxes only if the user is a premium subscriber.
    - Passed premium feature flags to the `CREATE_ANALYSIS_JOB` mutation.
- **Results Page (`/results/[job_id]`):
    - Integrated `GET_ME` GraphQL query to fetch user's premium status.
    - Implemented conditional rendering to display `generated_resume` and `generated_cover_letter` only if available and the user is a premium subscriber.

## 8. Frontend Development (Pricing Page)

- **Pricing Page (`/pricing`):**
    - Created a dedicated page to display pricing plans.
    - Integrated `shadcn/ui` components (`Card`, `Button`) and `lucide-react` icons.
    - Implemented `handleSubscribe` function to call the `UPGRADE_TO_PREMIUM` GraphQL mutation.
    - Displayed success/error messages and redirected to the `/app` page upon successful mock upgrade.

## Current Stage of the Application

The ResumeForge AI application is now **feature-complete** based on the provided `instructions.md`. All core functionalities for both free and premium tiers, including user authentication and a mock payment integration, have been implemented in both the frontend (Next.js) and backend (Django).

### Key Functionalities Implemented:

-   **User Authentication:** Registration, login, and session management using JWT.
-   **Free Tier Analysis:** Users can submit job descriptions and resumes to receive AI-generated analysis and suggestions.
-   **Premium Content Generation:** Premium users can opt for full resume and personalized cover letter generation.
-   **Mock Premium Upgrade:** A simulated upgrade process is in place to transition users to premium status.
-   **Asynchronous Processing:** Celery and RabbitMQ handle long-running AI tasks, with frontend polling for status updates.
-   **GraphQL API:** All frontend-backend communication is handled via a GraphQL API.
-   **Responsive UI:** Built with Next.js, Tailwind CSS, and `shadcn/ui` components.

### How to Run the Application:

To run the application, ensure you have Docker (for RabbitMQ) and Node.js/npm (for frontend) and Python/pip (for backend) installed.

1.  **Start RabbitMQ (using Docker):**
    ```bash
    docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
    ```

2.  **Start Django Backend:**
    ```bash
    cd backend
    .\venv\Scripts\python.exe manage.py runserver
    ```

3.  **Start Celery Worker:**
    ```bash
    cd backend
    .\venv\Scripts\celery.exe -A resumeforge_backend worker -l info
    ```

4.  **Start Next.js Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

Once all components are running, access the application at `http://localhost:3000`.

### Next Steps for Further Development (Beyond Current Scope):

-   **Real Payment Gateway Integration:** Replace the mock premium upgrade with actual Stripe (or other) payment processing.
-   **User Profile Management:** Implement pages for users to view and update their profile information.
-   **Resume Template Application:** Develop functionality to apply generated content to professional resume templates and enable PDF downloads.
-   **Advanced AI Features:** Explore more sophisticated AI capabilities for resume optimization and job matching.
-   **Comprehensive Testing:** Implement unit, integration, and end-to-end tests for both frontend and backend.
-   **Deployment Automation:** Set up CI/CD pipelines for automated testing and deployment to production environments.