import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import DB_Connection from "./src/DB/DB.js";
import jwt from "jsonwebtoken";

// GraphQL Imports
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { typeDefs } from './src/GraphQL/TypeDef/TypeDef.js';
import { resolvers } from './src/GraphQL/Resolver/Resolver.js';

// Route Imports
import UploadRouter from "./src/Routers/Global/Upload.js";
import Admin from "./src/Models/Global/User.js";
import Broker from "./src/Models/Global/Broker.js";
import PropertyOwner from "./src/Models/Global/Owner.js";
import Propertypdf from "./src/Routers/Global/Propertypdf.js";
import WhatsappRouter from "./src/Routers/Global/Whatsapp.js";


import TaxInvoiceRouter from "./src/Routers/Global/TaxInvoice.js";
import LedgerRouter from "./src/Routers/Global/Ledger.js";

const app = express();
const PORT = process.env.PORT || 7000; // ✅ RUNNING ON 7000

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: ["http://localhost:5173","http://localhost:8080", "https://xoloerp.com", "https://fingertip.co.in"],
  credentials: true,
}));

// ==========================================
// 1. UNIVERSAL UPLOAD ROUTE (REST)
// ==========================================
app.use("/api/v1/upload", UploadRouter);
app.use("/api/v1/propertypdf", Propertypdf);
app.use("/api/v1/whatsapp", WhatsappRouter);

app.use("/api/v1/taxinvoice", TaxInvoiceRouter);
app.use("/api/v1/ledger", LedgerRouter);


// ==========================================
// 2. GRAPHQL SERVER SETUP
// ==========================================
const startServer = async () => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });
console.log("SCHEMA CHECK:", typeDefs.includes("loginAdmin") ? "✅ NEW SCHEMA LOADED" : "❌ OLD SCHEMA LOADED");
  await apolloServer.start();

  // The single GraphQL endpoint. 
  app.use(
    '/graphql',
    cors({
      origin: ["http://localhost:5173", "http://localhost:8080", "https://xoloerp.com", "https://fingertip.co.in"],
      credentials: true,
    }),
    express.json(),
    
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        let user = null; // Default to Guest

        try {
          let token;
          let ModelToQuery;
          let role;

          // 1. Check Cookies first to determine the exact role and model
          if (req.cookies.AdminToken) {
            token = req.cookies.AdminToken;
            ModelToQuery = Admin;
            role = "ADMIN";
          } else if (req.cookies.BrokerToken) {
            token = req.cookies.BrokerToken;
            ModelToQuery = Broker;
            role = "BROKER";
          } else if (req.cookies.OwnerToken) {
            token = req.cookies.OwnerToken;
            ModelToQuery = PropertyOwner;
            role = "OWNER";
          } else if (req.headers.authorization?.startsWith("Bearer ")) {
            // 2. Fallback for Postman / Mobile Apps using Headers
            token = req.headers.authorization.split(" ")[1];
          }
          
          if (token) {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // If token came from headers (Postman), determine model via decoded role
            if (!ModelToQuery) {
              if (decoded.role === "ADMIN") { ModelToQuery = Admin; role = "ADMIN"; }
              else if (decoded.role === "BROKER") { ModelToQuery = Broker; role = "BROKER"; }
              else if (decoded.role === "OWNER") { ModelToQuery = PropertyOwner; role = "OWNER"; }
            }

            if (ModelToQuery) {
              const foundUser = await ModelToQuery.findById(decoded.id);
              if (foundUser) {
                // Attach the user object and their role to the context
                user = { id: foundUser._id, email: foundUser.email, role: role };
              }
            }
          }
        } catch (err) {
          // If the token is expired or invalid, quietly proceed as Guest
          console.warn("Soft Auth: Invalid token, proceeding as Guest.");
        }

        // Pass the user, req, and res down to the resolvers
        return { user, req, res }; 
      },
    })
  );

  // ==========================================
  // 3. START DATABASE & SERVER
  // ==========================================
  DB_Connection(process.env.DB_URI, process.env.DB_NAME)
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🚀 GraphQL Gateway ready at /graphql`);
      });
    })
    .catch((err) => {
      console.error("❌ Database connection failed:", err);
      process.exit(1);
    });
};

startServer();