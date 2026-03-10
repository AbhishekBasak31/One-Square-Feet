import jwt from "jsonwebtoken";


import { PropertyOwner } from "../Models/Global/Owner.js";

import Broker from "../Models/Global/Broker.js";
import Admin from "../Models/Global/User.js";

// Middleware: Authenticate user & attach user + role 
export const authenticate = async (req, res, next) => {
  try {
    let token;
    let ModelToQuery;
    let role;

    // 1. Identify the token and set the corresponding Model & Role
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
    }  else if (req.headers.authorization?.startsWith("Bearer ")) {
      // 2. Fallback for Postman / Mobile Apps using Headers instead of Cookies
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // 3. Verify the Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. If token came from headers (Postman), we use decoded role or default to User
    if (!ModelToQuery) {
      if (decoded.role === "ADMIN") { ModelToQuery = Admin; role = "ADMIN"; }
      else if (decoded.role === "BROKER") { ModelToQuery = Broker; role = "BROKER"; }
      else if (decoded.role === "OWNER") { ModelToQuery = PropertyOwner; role = "OWNER"; }

    }

    // 5. Fetch the specific entity from the database
    const user = await ModelToQuery.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Invalid token: Account not found in database" });
    }

    // 6. Attach the unified user object to the request
    req.user = {
      id: user._id,
      email: user.email,
      role: role // Adding role so downstream routes know WHO is uploading
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};