from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutTimeoutError
from .models import AnalysisJob
from .gemini import generate_resume_analysis, generate_full_resume, generate_cover_letter

def _run_analysis(job_id, generate_full_resume_flag, generate_cover_letter_flag):
    """
    The core analysis logic that will be run in a separate thread.
    """
    try:
        job = AnalysisJob.objects.get(id=job_id)
        job.status = 'IN_PROGRESS'
        job.save()

        # Sanitize and limit input size (as per instructions)
        job_description = job.job_description[:20000]
        resume_text = job.resume_text[:20000]

        # Always generate basic analysis
        analysis_result = generate_resume_analysis(job_description, resume_text)
        job.analysis_result = analysis_result

        # Generate premium content if flags are set
        if generate_full_resume_flag:
            full_resume = generate_full_resume(job_description, resume_text)
            job.generated_resume = full_resume

        if generate_cover_letter_flag:
            cover_letter = generate_cover_letter(job_description, resume_text)
            job.generated_cover_letter = cover_letter

        job.status = 'COMPLETED'
        job.save()
        return job
    except Exception as e:
        # Mark job as failed if any exception occurs during generation
        job = AnalysisJob.objects.get(id=job_id)
        job.status = 'FAILED'
        job.analysis_result = f"An unexpected error occurred: {str(e)}"
        job.save()
        # Re-raise the exception so the executor knows the task failed
        raise

def run_analysis_synchronously(job, generate_full_resume_flag, generate_cover_letter_flag):
    """
    Runs the AI analysis in a thread with a timeout.
    Updates the job status to FAILED if a timeout or any other exception occurs.
    """
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            _run_analysis, 
            job.id, 
            generate_full_resume_flag, 
            generate_cover_letter_flag
        )
        try:
            # Set a timeout (e.g., 30 seconds) for the analysis
            return future.result(timeout=30)
        except FutTimeoutError:
            job.status = 'FAILED'
            job.analysis_result = 'Processing timed out. Please try again.'
            job.save()
            raise Exception("Processing timed out.")
        except Exception as e:
            # The _run_analysis function will have already marked the job as FAILED.
            # We just re-raise the exception to the mutation.
            raise e
