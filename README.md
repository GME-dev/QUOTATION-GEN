# Quotation Generator for Gunawardana Motors

A web application for generating professional quotations with PDF export functionality.

## Features

- Create and manage quotations
- Add multiple items to each quotation
- Automatic quotation number generation
- PDF export with professional formatting
- Customer information management
- Real-time total calculation

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB Atlas
- PDF Generation: Puppeteer
- Styling: CSS3

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/GME-dev/QUOTATION-GEN.git
cd QUOTATION-GEN
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=development
PORT=5000
REACT_APP_PORT=5173
```

4. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 5173).

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Fill in the quotation form with customer details and items
3. Click "Generate Quotation" to create and download the PDF
4. The quotation will be automatically saved to the database

## API Endpoints

- `POST /api/quotations` - Create a new quotation and generate PDF
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get a specific quotation by ID

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.
