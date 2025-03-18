import React, { useState, useEffect } from 'react';
import './QuotationList.css';

// Get API URL from environment variable or default to production URL
const API_URL = process.env.REACT_APP_API_URL || 'https://quotation-gen-production.up.railway.app';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quotations`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }
      const data = await response.json();
      setQuotations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (quotationNo) => {
    try {
      const response = await fetch(`${API_URL}/api/quotations/${quotationNo}/download`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation-${quotationNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF');
    }
  };

  if (loading) return <div>Loading quotations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="quotation-list">
      <h2>Generated Quotations</h2>
      <div className="quotation-grid">
        {quotations.map((quotation) => (
          <div key={quotation._id} className="quotation-card">
            <div className="quotation-info">
              <h3>Quotation #{quotation.quotationNo}</h3>
              <p><strong>Customer:</strong> {quotation.customerName}</p>
              <p><strong>Date:</strong> {new Date(quotation.date).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> LKR {parseFloat(quotation.totalAmount).toLocaleString()}</p>
            </div>
            <button 
              onClick={() => handleDownload(quotation.quotationNo)}
              className="download-btn"
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>
      {quotations.length === 0 && (
        <p className="no-quotations">No quotations found</p>
      )}
    </div>
  );
};

export default QuotationList; 