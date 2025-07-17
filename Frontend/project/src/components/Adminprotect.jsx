
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";

const Adminprivate=({children})=>{
   
     const{isloggedin} = useAdminAuth()
     return isloggedin? children: <Navigate to="/Adminlogin"/>
}

export default Adminprivate