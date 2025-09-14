import User from "../models/user.model.js";
import jwt from 'jsonwebtoken'

const isAuth = async (req, res, next) => {
try {
   const token = req.cookies.token;   
   if (!token) {
     return res.status(401).json({ message: "Unauthorized" });
   }

   const decoded = jwt.verify(token, process.env.JWT_SECRET);  
   const user = await User.findById(decoded.id);
   if(!user){
     return res.status(401).json({ message: "Unauthorized" });
   }
   req.user = user;
   next();
 } catch (error) {
   console.error("Authentication error:", error);
   res.status(401).json({ message: "Unauthorized" });
 }
}
export default isAuth;