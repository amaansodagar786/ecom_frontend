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

import ScrollToTop from './Components/ScrolltoTop/ScrollToTop';

import AdminRoute from './Components/AdminRoute/AdminRoute';
import Footer from './Components/Footer/Footer';
import Wishlist from './Pages/Wishlist/Wishlist';

// ADMIN PAGES 
import AddProducts from './Pages/Admin/Products/AddProducts';
// import AdminSidebar from './Pages/Admin/Sidebar/AdminSidebar';
import Dashboard from './Pages/Admin/AdminPanel/Dashboard';
import Orders from './Pages/Admin/Orders/Orders';
import Inventory from './Pages/Admin/Inventory/Inventory';
import Payment from './Pages/Admin/Payment/Payment';
import Adminsignup from './Pages/Admin/Authentication/Adminsignup';

// USER PAGES 
import UserDashboard from './Pages/User/UserPanel/Dashboard';
import Address from './Pages/User/Address/Address';
import Userorder from './Pages/User/Orders/Userorder';
import UserOrderDetails  from './Pages/User/Orders/UserOrderDetails';
import ReviewandRating from './Pages/User/ReviewandRating/ReviewandRating';
import Support from './Pages/User/Support/Support';
import Cart from './Pages/Cart/Cart';
import AllProducts from './Pages/AllProducts/AllProducts';
import ProductPage from './Pages/Product/ProductPage';
import AuthCallback from './Pages/Authentication/Auth/AuthCallback';
import Loader from './Components/Loader/Loader';
import NewProduct from './Pages/Admin/Products/NewProduct';
import NewOrders from './Pages/Admin/OfflineOrders/NewOrders';
import Checkout from './Pages/CheckOut/Checkout';
import ForgotPassword from './Pages/Authentication/ForogtPass/ForgotPassword';
import CategoryUpdate from './Pages/Admin/CateHsnUpdate/CategoryUpdate';

import ShowOrders from './Pages/Admin/Orders/ShowOrders';
import OrderConfirm from './Components/OrderConfirm/OrderConfirm';
// import AcceptReject from './Pages/Admin/OrderAccept/AcceptReject';
import Device from './Pages/Admin/DeviceAdd/Device';
import OrderDetails from './Pages/Admin/CompleteDetails/OrderDetails';
import Offers from './Pages/Admin/Offers/Offers';
import Drivers from './Pages/User/Drivers/Drivers';
import UpdateDrivers from './Pages/Admin/UpdateDrivers/UpdateDrivers';
import usePageTracking from './Components/Hooks/usePageTracking';
// import Dummyorders from './Pages/Admin/Orders/Dummyorders';


function PageTracker() {
  usePageTracking();
  return null;
}

function App() {

  

  return (
    <AuthProvider>
      <Router basename="/">
      <ScrollToTop />
      <PageTracker />
        <Navbar />
        <Routes>
          <Route path="/coming" element={<ComingSoon />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Nopage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/products/:id" element={<ProductPage />} />

          <Route path="/products/by-category/:categoryId" element={<MainProducts />} />

          {/* USER PAGES  */}

          <Route path="/userdashboard" element={<UserDashboard />} />  
          <Route path="/address" element={<Address />} />
          <Route path="/userorders" element={< Userorder/>} />
          <Route path="/user/orders/:orderId" element={<UserOrderDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/randr" element={<ReviewandRating />} />
          <Route path="/support" element={<Support />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/drivers" element={<Drivers />} />
          {/* <Route path="/loader" element={<Loader />} /> */}

          {/* CHECKOUT  */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirm />} />




          {/* ADMIN PAGES  */}
          {/* <Route path="/adminreg" element={<Adminsignup />} /> */}
          <Route  path="/addproducts" element={ <AdminRoute> <AddProducts /> </AdminRoute>} />
          <Route path="/admindashboard" element={<AdminRoute> <Dashboard /> </AdminRoute> } />
          <Route path="/createorders" element={<AdminRoute> <NewOrders /> </AdminRoute> } />
          <Route path="/adminorders" element={<AdminRoute> <Orders /> </AdminRoute> } />
          <Route path="/admininventory" element={<AdminRoute> <Inventory /> </AdminRoute> } />
          <Route path="/admininpayment" element={<AdminRoute> <Payment /> </AdminRoute> } />
          <Route path="/updateproducts" element={<AdminRoute> <NewProduct /> </AdminRoute> } />
          <Route path="/categoryupdate" element={<AdminRoute> <CategoryUpdate /> </AdminRoute> } />
          <Route path="/orders/:orderId" element={<AdminRoute> <ShowOrders /> </AdminRoute> } />
          <Route path="/srnumbermanage" element={<AdminRoute> <Device /> </AdminRoute> } />
          <Route path="/orderdetails" element={<AdminRoute> <OrderDetails /> </AdminRoute> } />
          <Route path="/offers" element={<AdminRoute> <Offers /> </AdminRoute> } />
          <Route path="/updatedriver" element={<AdminRoute> <UpdateDrivers /> </AdminRoute> } />
          




        </Routes>
        <Footer/>
      </Router>
    </AuthProvider>
  );
}




export default App;