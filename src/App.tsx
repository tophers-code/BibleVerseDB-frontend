import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VerseList from './pages/VerseList';
import VerseForm from './pages/VerseForm';
import VerseDetail from './pages/VerseDetail';
import CategoryList from './pages/CategoryList';
import CategoryDetail from './pages/CategoryDetail';
import BookList from './pages/BookList';
import ProgressionList from './pages/ProgressionList';

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
          <Route path="categories/:id" element={<CategoryDetail />} />
          <Route path="books" element={<BookList />} />
          <Route path="progressions" element={<ProgressionList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
