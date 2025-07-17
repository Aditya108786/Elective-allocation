import React from 'react';
import AdminPanel from './pages/Adminpanel';
import StudentForm from './pages/StudentForm';
import { Link, Route , Routes } from 'react-router-dom';
import LandingPage from './components/Landingpage';
import Auth from './pages/Login'
import { AuthProvider } from './Authcontext';
import PrivateRoute from './components/PrivateRoute';
import Result from './pages/Result';
import Adminlogin from './pages/AdminAuthentication';
import Adminprotect from './components/Adminprotect';

export default function App() {
  return (
    <div>
      <AuthProvider>
    <Routes>
      <Route path='/adminlogin' element={<Adminlogin/>}></Route>
      <Route path='/' element={<LandingPage/>}></Route>
      <Route path='login' element={<Auth/>}></Route>
      <Route path='/Admin'
      
      element={
        <Adminprotect>
          <AdminPanel/>
        </Adminprotect>
      }
       />
      <Route path='/Result' element={<Result/>}></Route>
      
      <Route path="/student-portal" element={
            <PrivateRoute>
              <StudentForm />
            </PrivateRoute>
          } />
    </Routes>
    </AuthProvider>
    </div>
  );
}
