import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PreferredVersionProvider } from './contexts/PreferredVersionContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VerseList from './pages/VerseList';
import VerseForm from './pages/VerseForm';
import VerseDetail from './pages/VerseDetail';
import CategoryList from './pages/CategoryList';
import CategoryDetail from './pages/CategoryDetail';
import CategoryForm from './pages/CategoryForm';
import BookList from './pages/BookList';
import ProgressionList from './pages/ProgressionList';
import ProgressionForm from './pages/ProgressionForm';
import ProgressionDetail from './pages/ProgressionDetail';
import TagList from './pages/TagList';
import TagDetail from './pages/TagDetail';
import TagForm from './pages/TagForm';
import Settings from './pages/Settings';
import Quiz from './pages/Quiz';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <PreferredVersionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="verses" element={<VerseList />} />
              <Route path="verses/new" element={<VerseForm />} />
              <Route path="verses/:id" element={<VerseDetail />} />
              <Route path="verses/:id/edit" element={<VerseForm />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="categories/new" element={<CategoryForm />} />
              <Route path="categories/:id" element={<CategoryDetail />} />
              <Route path="categories/:id/edit" element={<CategoryForm />} />
              <Route path="tags" element={<TagList />} />
              <Route path="tags/new" element={<TagForm />} />
              <Route path="tags/:id" element={<TagDetail />} />
              <Route path="tags/:id/edit" element={<TagForm />} />
              <Route path="books" element={<BookList />} />
              <Route path="progressions" element={<ProgressionList />} />
              <Route path="progressions/new" element={<ProgressionForm />} />
              <Route path="progressions/:id" element={<ProgressionDetail />} />
              <Route path="progressions/:id/edit" element={<ProgressionForm />} />
              <Route path="settings" element={<Settings />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PreferredVersionProvider>
    </AuthProvider>
  );
}

export default App;
