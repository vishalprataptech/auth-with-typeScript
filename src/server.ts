import dotenv from "dotenv"
dotenv.config()
import express from "express"
import path from "node:path"
import {privateKey, publicKey} from "./utils/token.js"
import jose from "node-jose"
import db from "./index.js"
import { users,userClient,clientTable } from "./db/schema.js"
import { eq } from "drizzle-orm"
import {randomBytes,createHmac} from "node:crypto"
import jwt from "jsonwebtoken"
import cors from "cors";



async function main() {
    

    const PORT = process.env.PORT 
    const base = `http://localhost:${PORT}`
    const app = express()
    app.use(express.json())
    app.use(express.static((path.resolve('public'))))
 app.use(cors({
  origin: "*"
}))

    app.get('/',(_,res)=>{
        return res.json({message:"hello from auth server"})
    })

    app.get('/health',(_,res)=>{
        res.json({message:"server is fine"})
        return 
    })

    app.get('/.well-known/openid-configuration',(_,res)=>{
        const issuer = `${base}`
        res.json({
            issuer:issuer,
            authorization_endpoint:`${issuer}/o/oauth2/v2/auth`,
            userinfo_endpoint:`${issuer}/v1/userinfo`,
            jwks_uri:`${issuer}/oauth2/v3/certs`,
             token_endpoint: `${base}/token`,

        })})

    app.get('/oauth2/v3/certs', async (_,res)=>{
          const key = await jose.JWK.asKey(publicKey, "pem");
  return res.json({ keys: [key.toJSON()] });
    })

    app.get('/o/oauth2/v2/auth', async (req,res)=>{
         const {client_id} = req.query
         if(!client_id) return res.redirect(`http://localhost:5173/unauthorized`);
        
       const [client] =    await db
          .select()
            .from(clientTable)
            .where(eq(clientTable.clientId,req.query.client_id as string))
            if(!client) return res.sendFile(path.resolve('unathorized.html'));
         //@ts-ignore    
        return res.redirect(`http://localhost:5173/login?client_id=${client_id}`);
    });

    app.get('/dashboard',(_,res)=>{
        res.sendFile(path.resolve('dashboard.html'))
        return
    });



    app.post('/o/authenticate/sign-in', async (req,res)=>{
      
        const data = req.body
        if(!data) return res.status(400).json({message:"user data not recived"});
        const {email ,password,client_id,redirect_uri} = data

    

     const [user] =    await db
        .select()
        .from(users)
        .where(eq(users.email,email))



        if(!user || !user.password || !user.salt) return res.status(401).json({message:"user with this email not found"});
        const hash = createHmac('sha256',user.salt).update(password).digest("hex")

        if(user.password !== hash) return res.status(401).json({message:"user email or password is wrong"});
      const [client] = await db
        .select()
        .from(clientTable)
        .where(eq(clientTable.clientId,client_id as string))

        if(!client) return res.status(401).json({message:"client not found"});
        if(client.redirectUri !== redirect_uri) return res.status(401).json({message:"redirect uri mismatch"});
        

         const shortCode = randomBytes(13).toString("hex")
//@ts-ignore
       const shortCodeToken =  jwt.sign(shortCode,process.env.JWT_ACCESS_TOKEN_SECRATE,{expiresIn:"5m"})
//@ts-ignore
     const [value] =     await db
         .insert(userClient)
            .values({  clientId:client.clientId,userId:user.id,shortCode:shortCodeToken,salt:shortCode})
            .returning()


 

 if(!value) return res.status(500).json({message:"something went wrong"});


        res.redirect(`${redirect_uri}?code=${value.shortCode}`)
        
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
       res.redirect(`http://localhost:5173/sign-up`);
        return
    })

    app.post('/o/authenticate/sign-up', async (req,res)=>{
       

        const {firstName,lastName,email,password} = req.body
       
        if(!firstName || !email || !password) return res.status(400).json({message:"invalid fields"});

            const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return res.status(409).json({
        message: "user already exists",
      });
    }

     const salt =    randomBytes(32).toString("hex")
     const hashedPassword = createHmac('sha256',salt).update(password).digest("hex")

     await db
     .insert(users)
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

    app.post('/auth/client', async (req,res)=>{
        const {email,password,appName,applicationType,origin,redirectUri} = req.body
        console.log(req.body)
        if(!email || !password || !appName || !applicationType || !origin || !redirectUri) return res.status(400).json({message:"invalid fields"});

      const [user] =  await db
        .select()
        .from(users)
        .where(eq(users.email,email))
        
        if(!user || !user.password || !user.salt) return res.status(401).json({message:"user with this email not found"});
        const hash = createHmac('sha256',user.salt).update(password).digest("hex")
        if(user.password !== hash) return res.status(401).json({message:"user email or password is wrong"});


//@ts-ignore

   const clientId = randomBytes(12).toString("hex")
        
const salt = randomBytes(12).toString("hex")
const hashedPassword = createHmac("sha256",salt).update(password).digest("hex")
   const clientSecret = randomBytes(16).toString("hex")


try {
 const [clientData] =   await db
.insert(clientTable)
.values({
    email,password:hashedPassword,clientId,clientSecret,salt,  redirectUri,appName,applicationType,origin
})
.returning()


return res.status(200).json({
    client_id:clientData?.clientId,
    client_secrate: clientData?.clientSecret
})

} catch (error) {


          console.log("FULL ERROR:");
  console.log(error);

  console.log("CAUSE:");
  //@ts-ignore
  console.log(error.cause); 
    
    return res.status(400).json({message:"something went wrong"})

}



        // Implementation for creating OAuth client
    })

    app.post('/token', async (req,res)=>{
        const {code,client_id,client_secret} = req.body
        if(!code || !client_id || !client_secret) return res.status(400).json({message:"invalid fields"});




      const [shortCode] =   await db
        .select()
        .from(userClient)
        .where(eq(userClient.shortCode, code))  
if(!shortCode) return res.status(401).json({message:"invalid code"});

const [client] = await db 
.select()
.from(clientTable)
.where(eq(clientTable.clientId,shortCode.clientId))
if(!client) return res.status(401).json({message:"client not found"});
if(client.clientSecret !== client_secret) return res.status(401).json({message:"client secret mismatch"});

 const [userData] = await db
.select()
.from(users)
.where(eq(users.id,shortCode.userId))

if(!userData) return res.status(401).json({message:"user not found"});

       const now = Math.floor((Date.now()/1000))


        const token = jwt.sign({
            aud:    userData.id,
            email:userData.email,
            email_verified:userData.isVerified,
            exp: now + 3600,
            family_name:userData.lastName ?? null,
            given_name:userData.firstName,
            name:[userData.firstName,userData.lastName ?? undefined].filter(Boolean).join(" "),
           
        },privateKey,{algorithm:"RS256"})


        res.json({
            access_token:token,
            token_type:"Bearer",
            expires_in:3600
        })

        return
    })

    app.listen(PORT,()=>{
        console.log(`server is running at ${base}`)
    })
}

main()