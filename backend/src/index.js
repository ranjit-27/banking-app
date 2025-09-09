import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import mongoose from "mongoose";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/schema.js";
import dotenv from 'dotenv'
import cors from "cors"

import {authMiddleWare} from './middleware/auth.js'
dotenv.config()
 
const app =express();

app.use(express.json())


 
const server = new ApolloServer({
    typeDefs,
    resolvers
});
 
const startServer = async()=>{
    await server.start();
    app.use(
        '/graphql',
        cors(),
        expressMiddleware(server,{
            context:async({req,res})=>{
                authMiddleWare(req,res,()=>{ })
                console.log(req.user)
                return {user:req.user}
            }
        })
    )
};


mongoose.connect('mongodb://localhost:27017/banking-app')
.then(()=>{
    console.log('Mongo Db connected')
    const PORT = process.env.PORT;
    app.listen(PORT,()=>{
        console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });
}).catch(err=> console.error("Mongodb error:"));
 


startServer()
 