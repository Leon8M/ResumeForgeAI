import { gql } from "@apollo/client";

export const CREATE_ANALYSIS_JOB = gql`
  mutation CreateAnalysisJob($jobDescription: String!, $resumeText: String!, $generateFullResume: Boolean, $generateCoverLetter: Boolean) {
    createAnalysisJob(jobDescription: $jobDescription, resumeText: $resumeText, generateFullResume: $generateFullResume, generateCoverLetter: $generateCoverLetter) {
      job {
        id
        status
      }
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $password: String!, $email: String!) {
    createUser(username: $username, password: $password, email: $email) {
      user {
        id
        username
        email
      }
    }
  }
`;

export const TOKEN_AUTH = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
      refreshExpiresIn
    }
  }
`;

export const UPGRADE_TO_PREMIUM = gql`
  mutation UpgradeToPremium {
    upgradeToPremium {
      success
      message
    }
  }
`;
