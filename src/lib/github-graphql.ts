import { gql } from "@apollo/client";

export const LIST_REPOSITORIES = gql`
  query ListRepositories {
    viewer {
      repositories(first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          id
          name
          nameWithOwner
          description
          url
          isPrivate
          defaultBranchRef {
            name
          }
        }
      }
    }
  }
`;

export const GET_REPOSITORY = gql`
  query GetRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      nameWithOwner
      description
      url
      isPrivate
      defaultBranchRef {
        name
      }
    }
  }
`;

export const CREATE_REPOSITORY = gql`
  mutation CreateRepository($name: String!, $visibility: RepositoryVisibility!) {
    createRepository(input: { name: $name, visibility: $visibility }) {
      repository {
        id
        name
        nameWithOwner
        url
        isPrivate
        defaultBranchRef { name }
      }
    }
  }
`;
