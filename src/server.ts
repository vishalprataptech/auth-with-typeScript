import dotenv from "dotenv"
dotenv.config()
import express from "express"
import path from "node:path"
import {privateKey,publicKey} from "./utils/token.js"
import jose from "node-jose"
import db from "./index.js"
import { usersTable } from "./db/schema/userTable.js"
import { eq } from "drizzle-orm"
import {randomBytes,createHmac} from "node:crypto"
import jwt from "jsonwebtoken"




async function main() {

    const PORT = process.env.PORT 
    const app = express()
    app.use(express.json())
    app.use(express.static((path.resolve('public'))))

    app.get('/',(_,res)=>{
        return res.json({message:"hello from auth server"})
    })

    app.get('/health',(_,res)=>{
        res.json({message:"server is fine"})
        return 
    })

    app.get('/.well-known/openid-configuration',(_,res)=>{
        const issuer = `http://localhost:${PORT}`
        res.json({
            issuer:issuer,
            authorization_endpoint:`${issuer}/o/oauth2/v2/auth`,
            userinfo_endpoint:`${issuer}/v1/userinfo`,
            jwks_uri:`${issuer}/oauth2/v3/certs`

        })
    })

    app.get('/oauth2/v3/certs', async (_,res)=>{
          const key = await jose.JWK.asKey(publicKey, "pem");
  return res.json({ keys: [key.toJSON()] });
    })

    app.get('/o/oauth2/v2/auth',(_,res)=>{
        res.sendFile(path.resolve('public','authenticate.html'))
        return
    })

    app.post('/o/authenticate/sign-in', async (req,res)=>{
        const data = req.body
        if(!data) return res.status(400).json({message:"user data not recived"});
        const {email ,password} = data

     const [user] =    await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email,email))

        if(!user || !user.password || !user.salt) return res.status(401).json({message:"user with this email not found"});
        const hash = createHmac('sha256',user.salt).update(password).digest("hex")

        if(user.password !== hash) return res.status(401).json({message:"user email or password is wrong"});
        const now = Math.floor((Date.now()/1000))


        const token = jwt.sign({
            aud:user.id,
            email:user.email,
            email_verified:user.emailVerified,
            exp: now + 3600,
            family_name:user.lastName ?? null,
            given_name:user.firstName,
            name:[user.firstName,user.lastName ?? undefined].filter(Boolean).join(" "),
            picture:user.profileImageURL ?? ""
        },privateKey,{algorithm:"RS256"})

 


        res.json({token})
        
        return
    })

    app.get('/v1/userinfo', async (req,res)=>{
        if(!req.headers.authorization?.startsWith("Bearer ")) return res.json({message:"token not found"})

            const token = req.headers.authorization.split(" ")[1]
            if(!token) return res.json({message:"token not received "});
            
            try {
               const userData =  jwt.verify(token,publicKey,{algorithms:["RS256"]})

               return res.json({
                userData
               })
            } catch (error) {
                return res.json({message:"invalid token"})
            }  

           

    })

    app.get('/sign-up',(_,res)=>{
        res.sendFile(path.resolve('public/signup.html'))
        return
    })

    app.post('/o/authenticate/sign-up', async (req,res)=>{
        const {firstName,lastName,email,password} = req.body
        if(!firstName || !email || !password) return res.status(400).json({message:"invalid fields"});

     const salt =    randomBytes(32).toString("hex")
     const hashedPassword = createHmac('sha256',salt).update(password).digest("hex")

     await db
     .insert(usersTable)
     .values({
        firstName,
        lastName: lastName ?? undefined ,
        email,
        password:hashedPassword,
        salt
     })

     res.status(200).json({message:"user registration successful"})
return
    })


    app.listen(PORT,()=>{
        console.log(`server is running at http://localhost:${PORT}`)
    })
}

main()