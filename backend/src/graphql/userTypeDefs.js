import {gql} from "graphql-tag"
export const userTypeDefs=gql`
type User{
id:ID!
name:String!
email:String!
createdAt:String!
}

type AuthPayload{
token:String!
user:User!
}

input CreateUserInput{
name:String!
email:String!
password:String!
}

input UpdateUserInput{
name:String
email:String
password:String
}

extend type Query{
users:[User!]
user(id:ID!):User
}

extend type Mutation{
createUser(input:CreateUserInput!):User
updateUser(id:ID!, input:UpdateUserInput!):User!
deleteUser(id:ID!):Boolean
login(email:String!,password:String!):AuthPayload
}
`