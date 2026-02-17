import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="verses" element={<VerseList />} />
          <Route path="verses/new" element={<VerseForm />} />
          <Route path="verses/:id" element={<VerseDetail />} />
          <Route path="verses/:id/edit" element={<VerseForm />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/new" element={<CategoryForm />} />
          <Route path="categories/:id" element={<CategoryDetail />} />
          <Route path="categories/:id/edit" element={<CategoryForm />} />
          <Route path="books" element={<BookList />} />
          <Route path="progressions" element={<ProgressionList />} />
          <Route path="progressions/new" element={<ProgressionForm />} />
          <Route path="progressions/:id" element={<ProgressionDetail />} />
          <Route path="progressions/:id/edit" element={<ProgressionForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
