from celery import shared_task
from .models import AnalysisJob
from .gemini import generate_resume_analysis, generate_full_resume, generate_cover_letter

@shared_task
def process_resume_analysis(job_id, generate_full_resume_flag=False, generate_cover_letter_flag=False):
    """
    Celery task to process a resume analysis request, with optional full resume and cover letter generation.
    """
    try:
        job = AnalysisJob.objects.get(id=job_id)
        job.status = 'IN_PROGRESS'
        job.save()

        # Always generate basic analysis for free tier
        analysis_result = generate_resume_analysis(job.job_description, job.resume_text)
        job.analysis_result = analysis_result

        # Generate premium content if flags are set
        if generate_full_resume_flag:
            full_resume = generate_full_resume(job.job_description, job.resume_text)
            job.generated_resume = full_resume

        if generate_cover_letter_flag:
            cover_letter = generate_cover_letter(job.job_description, job.resume_text)
            job.generated_cover_letter = cover_letter

        job.status = 'COMPLETED'
        job.save()

    except AnalysisJob.DoesNotExist:
        # Handle case where job is not found
        pass
    except Exception as e:
        # Handle other exceptions and mark the job as failed
        try:
            job = AnalysisJob.objects.get(id=job_id)
            job.status = 'FAILED'
            job.analysis_result = str(e) # Store error message in analysis_result for debugging
            job.save()
        except AnalysisJob.DoesNotExist:
            pass # Job was deleted before we could mark it as failed