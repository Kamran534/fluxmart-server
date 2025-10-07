// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.

export const typeDefs = `#graphql
  scalar Date

  type Address {
    label: String
    line1: String
    line2: String
    city: String
    state: String
    postalCode: String
    country: String
    isDefault: Boolean
  }

  type User {
    id: ID!
    email: String!
    name: String
    profileImageUrl: String
    isEmailVerified: Boolean
    roles: [String!]
    addresses: [Address!]
    createdAt: Date
    updatedAt: Date
  }

  input AddressInput {
    label: String
    line1: String
    line2: String
    city: String
    state: String
    postalCode: String
    country: String
    isDefault: Boolean
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

  input PresignProfileImageInput {
    contentType: String!
    fileExtension: String
  }

  type PresignedUploadPayload {
    url: String!
    key: String!
    fields: String
  }

  type PresignedViewPayload {
    url: String!
    expiresIn: Int!
  }

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthTokens!
    logout: Boolean!
    presignProfileImageUpload(input: PresignProfileImageInput!): PresignedUploadPayload!
    setProfileImage(key: String!): User!
    presignProfileImageView(key: String!): PresignedViewPayload!
    requestEmailOTP(email: String!): Boolean!
    verifyEmailOTP(email: String!, otp: String!): AuthPayload!
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    addAddress(input: AddressInput!): User!
    updateAddress(index: Int!, input: AddressInput!): User!
    removeAddress(index: Int!): User!
    setDefaultAddress(index: Int!): User!
    setRoles(userId: ID!, roles: [String!]!): User!
  }
`;