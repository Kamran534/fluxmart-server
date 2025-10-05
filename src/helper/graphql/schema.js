// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.

export const typeDefs = `#graphql
  scalar Date

  type User {
    id: ID!
    email: String!
    name: String
    isEmailVerified: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
  }

  type AuthPayload {
    user: User!
    tokens: AuthTokens!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthTokens!
    logout: Boolean!
    requestEmailOTP(email: String!): Boolean!
    verifyEmailOTP(email: String!, otp: String!): AuthPayload!
  }
`;