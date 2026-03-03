import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AdminProvider } from "@/context/AdminContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import WriteupsPage from "@/pages/WriteupsPage";
import WriteupPage from "@/pages/WriteupPage";
import ResourcesPage from "@/pages/ResourcesPage";
import ContactPage from "@/pages/ContactPage";
import AboutPage from "@/pages/AboutPage";
import AdminPage from "@/pages/AdminPage";
import AdminWriteupEditor from "@/pages/AdminWriteupEditor";

function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/writeups" element={<WriteupsPage />} />
              <Route path="/archive" element={<WriteupsPage />} />
              <Route path="/writeup/:id" element={<WriteupPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* Admin routes - protected by HTTP Basic Auth */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/writeup/new" element={<AdminWriteupEditor />} />
              <Route path="/admin/writeup/:id" element={<AdminWriteupEditor />} />
            </Route>
          </Routes>
          <Toaster position="bottom-right" theme="dark" />
          <div className="noise-overlay" />
        </div>
      </BrowserRouter>
    </AdminProvider>
  );
}

export default App;
