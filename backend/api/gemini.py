import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_resume_analysis(job_description, resume_text):
    """
    Uses the Gemini API to analyze a resume against a job description.

    Provide a brief analysis of the resume's strengths and weaknesses, and suggest key skills and keywords to add for better alignment with the job description.
    """
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"""Analyze the following resume based on the provided job description.

    **Job Description:**
    {job_description}

    **Resume:**
    {resume_text}

    Provide a brief analysis of the resume's strengths and weaknesses, and suggest key skills and keywords to add for better alignment with the job description.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Handle potential API errors (e.g., connection issues, invalid key)
        return f"An error occurred while generating the analysis: {e}"

def generate_full_resume(job_description, resume_text):
    """
    Uses the Gemini API to generate a full tailored resume based on user info and job description.
    """
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"""Generate a full, tailored resume based on the provided job description and the user's existing resume content.
    Focus on highlighting relevant experience and skills from the user's resume that match the job description.

    **Job Description:**
    {job_description}

    **User's Existing Resume Content:**
    {resume_text}

    Provide the generated resume in a clear, professional text format. Do not include any introductory or concluding remarks, just the resume content.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred while generating the full resume: {e}"

def generate_cover_letter(job_description, resume_text):
    """
    Uses the Gemini API to generate a personalized cover letter.
    """
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"""Generate a personalized cover letter for the provided job description, drawing relevant experience and skills from the user's resume content.

    **Job Description:**
    {job_description}

    **User's Existing Resume Content:**
    {resume_text}

    Provide the generated cover letter in a professional text format. Do not include any introductory or concluding remarks, just the cover letter content.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred while generating the cover letter: {e}"