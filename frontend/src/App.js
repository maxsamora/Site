import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ArchivePage from "@/pages/ArchivePage";
import WriteupPage from "@/pages/WriteupPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import CreateWriteupPage from "@/pages/CreateWriteupPage";
import EditWriteupPage from "@/pages/EditWriteupPage";
import ResourcesPage from "@/pages/ResourcesPage";
import ContactPage from "@/pages/ContactPage";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/writeup/:id" element={<WriteupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/create" element={<CreateWriteupPage />} />
              <Route path="/edit/:id" element={<EditWriteupPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
          <Toaster position="bottom-right" theme="dark" />
          <div className="noise-overlay" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
