import React, { useState, useEffect } from 'react';
import './QuotationForm.css';

const QuotationForm = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerAddress: '',
    bikeRegNo: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0 }],
    remarks: 'Payment should be made within 7 days of invoice date.'
  });
  
  const [quotationNo, setQuotationNo] = useState('');
  
  useEffect(() => {
    // Generate quotation number: GM-YYYYMMDD-XXX
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // For demo, we'll just use a random 3-digit number
    const randomNum = String(Math.floor(Math.random() * 900) + 100);
    
    setQuotationNo(`GM-${year}${month}${day}-${randomNum}`);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    });
  };
  
  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const amount = parseFloat(item.quantity) * parseFloat(item.rate || 0);
      return total + amount;
    }, 0).toFixed(2);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quotationNo,
          totalAmount: calculateTotal()
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quotation-${quotationNo}.pdf`;
        a.click();
        
        // Reset form after successful submission
        setFormData({
          customerName: '',
          customerAddress: '',
          bikeRegNo: '',
          date: new Date().toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, rate: 0 }],
          remarks: 'Payment should be made within 7 days of invoice date.'
        });
        
        // Generate new quotation number
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 900) + 100);
        setQuotationNo(`GM-${year}${month}${day}-${randomNum}`);
        
      } else {
        console.error('Failed to generate quotation');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <div className="quotation-form-container">
      <h1>Gunawardana Motors - Quotation Generator</h1>
      
      <form onSubmit={handleSubmit} className="quotation-form">
        <div className="form-header">
          <div className="form-group">
            <label>Quotation No:</label>
            <input
              type="text"
              value={quotationNo}
              readOnly
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>
        
        <div className="customer-section">
          <h2>Customer Information</h2>
          
          <div className="form-group">
            <label>Customer Name:</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Bike Registration No:</label>
            <input
              type="text"
              name="bikeRegNo"
              value={formData.bikeRegNo}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="items-section">
          <h2>Items</h2>
          
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate (LKR)</th>
                <th>Amount (LKR)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="form-control"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="form-control"
                      min="1"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className="form-control"
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td>
                    {(parseFloat(item.quantity) * parseFloat(item.rate || 0)).toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="btn-remove"
                      disabled={formData.items.length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right">
                  <strong>Total:</strong>
                </td>
                <td>
                  <strong>{calculateTotal()}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <button type="button" onClick={addItem} className="btn-add">
            Add Item
          </button>
        </div>
        
        <div className="form-group">
          <label>Remarks:</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-generate">
            Generate Quotation
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;