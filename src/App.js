import React from 'react';
import './App.css';
import QuotationForm from './QuotationForm';
import QuotationList from './QuotationList';

function App() {
  return (
    <div className="App">
      <QuotationForm />
      <QuotationList />
    </div>
  );
}

export default App;