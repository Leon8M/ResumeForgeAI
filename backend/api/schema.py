import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model, authenticate
from graphql_jwt.decorators import login_required
from django.conf import settings
from django.utils import timezone
import graphql_jwt
from graphql_jwt.shortcuts import create_refresh_token, get_token


from .models import AnalysisJob, Subscription
from .analysis import run_analysis_synchronously

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

        # Input validation
        if len(job_description) > 20000 or len(resume_text) > 20000:
            raise Exception("Input text exceeds the maximum length of 20,000 characters.")

        job = AnalysisJob.objects.create(
            job_description=job_description,
            resume_text=resume_text
        )
        
        try:
            # Run the analysis synchronously with a timeout
            run_analysis_synchronously(job, generate_full_resume, generate_cover_letter)
        except Exception as e:
            # The exception (e.g., timeout) is already handled in run_analysis_synchronously
            # by setting the job status to FAILED. We re-raise it here to let GraphQL
            # report the error to the client.
            raise e
        
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

# New Auth Mutations
class TokenAuth(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    success = graphene.Boolean()
    token = graphene.String()
    user = graphene.Field(UserType)

    def mutate(self, info, username, password):
        user = authenticate(username=username, password=password)
        if user is None:
            raise Exception('Invalid credentials')

        # Get JWT token
        token = get_token(user)
        
        # Get refresh token and set it in an HttpOnly cookie
        refresh_token = create_refresh_token(user)
        info.context.set_cookie(
            settings.GRAPHQL_JWT.get("JWT_REFRESH_TOKEN_COOKIE_NAME"),
            refresh_token,
            expires=timezone.now() + settings.GRAPHQL_JWT.get("JWT_REFRESH_EXPIRATION_DELTA"),
            httponly=True,
            secure=settings.GRAPHQL_JWT.get("JWT_COOKIE_SECURE"),
            samesite=settings.GRAPHQL_JWT.get("JWT_COOKIE_SAMESITE")
        )

        return TokenAuth(success=True, token=token, user=user)

class Logout(graphene.Mutation):
    success = graphene.Boolean()

    def mutate(self, info):
        info.context.delete_cookie(settings.GRAPHQL_JWT.get("JWT_REFRESH_TOKEN_COOKIE_NAME"))
        return Logout(success=True)


class Mutation(graphene.ObjectType):
    # App-specific mutations
    create_user = CreateUser.Field()
    create_analysis_job = CreateAnalysisJob.Field()
    upgrade_to_premium = UpgradeToPremium.Field()

    # Auth mutations
    token_auth = TokenAuth.Field()
    logout = Logout.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()