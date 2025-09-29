import { gql } from "@apollo/client";

export const GET_ANALYSIS_JOB = gql`
  query GetAnalysisJob($id: UUID!) {
    job(id: $id) {
      id
      status
      analysisResult
      generatedResume
      generatedCoverLetter
      createdAt
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      username
      email
      isPremium
      subscription {
        plan
        activeUntil
      }
    }
  }
`;