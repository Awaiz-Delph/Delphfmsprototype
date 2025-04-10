import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Instead of extending the Express namespace, we'll use a type assertion when needed
// This avoids TypeScript conflicts with the schema's User type

const scryptAsync = promisify(scrypt);

// Helper functions for password hashing and verification
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format:", stored);
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configure session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "delphnoid-warehouse-fleet-management-system",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local authentication strategy
  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: false
    }, async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        
        // Handle empty credentials
        if (!username || !password) {
          console.log("Empty credentials provided");
          return done(null, false);
        }
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`No user found with username: ${username}`);
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match result: ${passwordMatch}`);
        
        if (!passwordMatch) {
          return done(null, false);
        }
        
        // Update last login time
        await storage.updateUser(user.id, { 
          lastLogin: new Date() 
        });
        
        // Add login activity
        await storage.addActivity({
          id: Date.now(),
          type: 'user',
          iconName: 'log-in',
          message: `User ${user.username} logged in`,
          timestamp: new Date()
        });
        
        return done(null, user as any);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    }),
  );

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`No user found with id: ${id}`);
        return done(null, false);
      }
      
      done(null, user as any);
    } catch (err) {
      console.error("Deserialization error:", err);
      done(err);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Add registration activity
      await storage.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'user-plus',
        message: `New user ${user.username} registered`,
        timestamp: new Date()
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user as any;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user as any;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Add logout activity if user is logged in
    if (req.user) {
      storage.addActivity({
        id: Date.now(),
        type: 'user',
        iconName: 'log-out',
        message: `User ${(req.user as User).username} logged out`,
        timestamp: new Date()
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}