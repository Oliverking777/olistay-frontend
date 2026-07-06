import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import LayOut from "./Components/LayOut";
import LandingPage from "./Pages/LandingPage";
import SignIn from "./Pages/auth/SignIn";
import SignUp from "./Pages/auth/SignUp";
import SearchPage from "./Pages/SearchPage";
import FinancialProfile from "./Pages/FinancialProfile";
import AccountSettings from "./Pages/AccountSettings";
import Profile from "./Pages/Profile";
import MyRecommendation from "./Pages/MyRecommendation";
import PropertyDetail from "./Pages/PropertyDetail";
import BecomeALandLord from "./Pages/BecomeALandLord";
import HostLayOut from "./Components/HostLayOut";
import HostProperties from "./Pages/HostProperties";
import HostPropertyDetail from "./Pages/HostPropertyDetail";
import HostAppointments from "./Pages/HostAppointments";
import HostPredictions from "./Pages/HostPredictions";
import ProtectedRoute from "./Components/ProtectedRoute";
import CreateProperty from "./Pages/CreateProperty";
import AdminLayout from "./Components/AdminLayout";
import AdminDashboard from "./Pages/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* LayOut wraps every route below it with SideBar + NavBar */}
          <Route path="/" element={<LayOut />}>
            <Route index element={<LandingPage />} />
            <Route path="search" element={<SearchPage />} />
            {/* Dynamic property detail — backend requires /properties/{id} */}
            <Route path="property/:id" element={<PropertyDetail />} />
            <Route path="become-a-landlord" element={<BecomeALandLord />} />

            {/* Tenant account pages: these call authenticated-only backend
                endpoints (/users/me, /tenant/**, /properties/recommendations).
                Guard on authentication (any role) so anonymous visitors are
                redirected to sign-in instead of hitting a 401/refresh storm
                and seeing an error page. */}
            <Route element={<ProtectedRoute />}>
              <Route path="financial-profile" element={<FinancialProfile />} />
              <Route path="account-settings" element={<AccountSettings />} />
              
              <Route path="profile" element={<Profile />} />
              <Route path="my-recommendation" element={<MyRecommendation />} />
            </Route>
          </Route>

          {/* HostLayOut wraps the host-facing pages with HostSideBar.
              Paths match HostSidebar.jsx's menuItems exactly. Guarded so
              only authenticated HOST users can reach /properties,
              /appointments, /predictions directly. */}
          <Route element={<ProtectedRoute allowedRoles={["HOST", "LANDLORD"]} />}>
            <Route path="/" element={<HostLayOut />}>
<Route path="properties" element={<HostProperties />} />
               <Route
                 path="properties/me"
                 element={<Navigate to="/properties" replace />}
               />
               <Route path="search" element={<SearchPage />} />
            {/* Dynamic property detail — backend requires /properties/{id} */}
              <Route path="property/:id" element={<PropertyDetail />} />
               <Route path="properties/new" element={<CreateProperty />} />
               <Route path="properties/:id" element={<HostPropertyDetail />} />
               <Route path="appointments" element={<HostAppointments />} />
               
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Routes OUTSIDE LayOut (no sidebar/navbar) — full-screen auth pages */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}