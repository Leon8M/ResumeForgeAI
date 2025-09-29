import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from graphql_jwt.decorators import login_required
from django.conf import settings
from django.utils import timezone

from .models import AnalysisJob, Subscription
from .tasks import process_resume_analysis

# Enums
class JobStatusEnum(graphene.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PlanTypeEnum(graphene.Enum):
    FREE = "FREE"
    PREMIUM = "PREMIUM"

# Object Types
class SubscriptionType(DjangoObjectType):
    class Meta:
        model = Subscription
        fields = ("plan", "active_until")

class UserType(DjangoObjectType):
    is_premium = graphene.Boolean()
    subscription = graphene.Field(SubscriptionType)

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "is_premium", "subscription")

    def resolve_is_premium(self, info):
        if hasattr(self, 'subscription'):
            return self.subscription.is_premium()
        return False

    def resolve_subscription(self, info):
        if hasattr(self, 'subscription'):
            return self.subscription
        return None

class AnalysisJobType(DjangoObjectType):
    class Meta:
        model = AnalysisJob
        fields = ("id", "status", "analysis_result", "generated_resume", "generated_cover_letter", "created_at")

# Queries
class Query(graphene.ObjectType):
    job = graphene.Field(AnalysisJobType, id=graphene.UUID())
    me = graphene.Field(UserType)

    def resolve_job(self, info, id):
        try:
            return AnalysisJob.objects.get(pk=id)
        except AnalysisJob.DoesNotExist:
            return None

    @login_required
    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")
        return user

# Mutations
class CreateUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        email = graphene.String(required=True)

    def mutate(self, info, username, password, email):
        user = get_user_model()(username=username, email=email)
        user.set_password(password)
        user.save()
        # Create a default free subscription for the new user
        Subscription.objects.create(user=user, plan='FREE')
        return CreateUser(user=user)

class CreateAnalysisJob(graphene.Mutation):
    class Arguments:
        job_description = graphene.String(required=True)
        resume_text = graphene.String(required=True)
        generate_full_resume = graphene.Boolean(required=False, default_value=False)
        generate_cover_letter = graphene.Boolean(required=False, default_value=False)

    job = graphene.Field(lambda: AnalysisJobType)

    @login_required
    def mutate(self, info, job_description, resume_text, generate_full_resume, generate_cover_letter):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required to create analysis jobs.")

        # Check for premium features
        if (generate_full_resume or generate_cover_letter) and not user.subscription.is_premium():
            raise Exception("Premium subscription required for full resume or cover letter generation.")

        job = AnalysisJob.objects.create(
            job_description=job_description,
            resume_text=resume_text
        )
        
        # Trigger Celery task asynchronously with premium flags
        process_resume_analysis.delay(job.id, generate_full_resume, generate_cover_letter)
        
        return CreateAnalysisJob(job=job)

class UpgradeToPremium(graphene.Mutation):
    class Arguments:
        # In a real scenario, this would involve a payment token or similar
        pass

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required to upgrade to premium.")

        # Mock action for upgrading to premium
        subscription = user.subscription
        subscription.plan = 'PREMIUM'
        subscription.active_until = timezone.now() + timezone.timedelta(days=30) # Mock 30-day premium
        subscription.save()

        return UpgradeToPremium(success=True, message="Successfully upgraded to Premium!")

class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    create_analysis_job = CreateAnalysisJob.Field()
    upgrade_to_premium = UpgradeToPremium.Field()
