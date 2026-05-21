import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Normalization from './views/Normalization';
import ERD from './views/ERD';
import DataDictionary from './views/DataDictionary';
import Migration from './views/Migration';
import SQLPlayground from './views/SQLPlayground';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/normalization" element={<Normalization />} />
          <Route path="/erd" element={<ERD />} />
          <Route path="/dictionary" element={<DataDictionary />} />
          <Route path="/migration" element={<Migration />} />
          <Route path="/playground" element={<SQLPlayground />} />
          {/* Fallback to Dashboard if route not found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
