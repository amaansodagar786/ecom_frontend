// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import ComingSoon from './Pages/Comingsoon/Comingsoon';
import Navbar from './Components/Navbar/Navbar';
import Nopage from './Pages/Nppage/Nopage';
import Register from './Pages/Authentication/Register/Register';
import Login from './Pages/Authentication/Login/Login';
import Profile from './Pages/Account/Profile';
import { AuthProvider } from './Components/Context/AuthContext';
import Home from './Pages/Home/Home';
import MainProducts from './Pages/Mainproducts/Mainproducts';
// import Adminsignup from './Pages/Admin/Authentication/Adminsignup';
import AddProducts from './Pages/Admin/Products/AddProducts';
import AdminRoute from './Components/AdminRoute/AdminRoute';
import Footer from './Components/Footer/Footer';
import Wishlist from './Pages/Wishlist/Wishlist';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/coming" element={<ComingSoon />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Nopage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />


          <Route path="/products/:category" element={<MainProducts />} />


          {/* ADMIN PAGES  */}
          {/* <Route path="/adminreg" element={<Adminsignup />} /> */}


          <Route path="/wishlist" element={<Wishlist />} />

          <Route 
            path="/addproducts" 
            element={
              <AdminRoute>
                <AddProducts />
              </AdminRoute>
            } 
          />




        </Routes>
        <Footer/>
      </Router>
    </AuthProvider>
  );
}




export default App;