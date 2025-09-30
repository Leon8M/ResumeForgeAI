import json
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from graphene_django.utils.testing import GraphQLTestCase
from resumeforge_backend.schema import schema

@pytest.mark.django_db
class AuthTests(GraphQLTestCase):
    GRAPHQL_SCHEMA = schema

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            password='testpassword',
            email='test@example.com'
        )

    def test_login_mutation(self):
        """
        Tests the tokenAuth mutation for logging in.
        """
        query = '''
            mutation TokenAuth($username: String!, $password: String!) {
                tokenAuth(username: $username, password: $password) {
                    success
                    token
                    user {
                        id
                        username
                        email
                    }
                }
            }
        '''
        response = self.query(
            query,
            op_name='TokenAuth',
            variables={'username': 'testuser', 'password': 'testpassword'}
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        
        # Check that the query was successful and returned the correct data
        self.assertTrue(content['data']['tokenAuth']['success'])
        self.assertIsNotNone(content['data']['tokenAuth']['token'])
        self.assertEqual(content['data']['tokenAuth']['user']['username'], 'testuser')

        # Check that the refresh token cookie was set
        self.assertIn('refresh_token', response.cookies)

    def test_login_mutation_invalid_credentials(self):
        """
        Tests the tokenAuth mutation with invalid credentials.
        """
        query = '''
            mutation TokenAuth($username: String!, $password: String!) {
                tokenAuth(username: $username, password: $password) {
                    success
                    token
                }
            }
        '''
        response = self.query(
            query,
            op_name='TokenAuth',
            variables={'username': 'testuser', 'password': 'wrongpassword'}
        )

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        # Check that the query failed as expected
        self.assertIsNotNone(content['errors'])
        self.assertIsNone(content['data']['tokenAuth'])