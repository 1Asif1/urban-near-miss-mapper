# Urban Near Miss Mapper

A web application for reporting and visualizing near-miss incidents in urban areas to improve road safety.

## Features

- Interactive map interface for viewing and reporting near-miss incidents
- Real-time visualization of incident data
- Filter incidents by type, severity, and date range
- Responsive design works on desktop and mobile devices

## Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3.9+ (for local backend development)

## Getting Started

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd near-miss-mapper
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following content:
   ```
   MONGO_URI=mongodb://localhost:27017/
   DB_NAME=near_miss_db
   ```

### Running with Docker (Recommended)

1. Make sure Docker and Docker Compose are installed and running

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - MongoDB Express: http://localhost:8081

## Project Structure

```
near_miss_mapper/
├── backend/               # FastAPI backend
│   ├── app/              
│   │   ├── main.py       # FastAPI application
│   │   ├── models.py     # Pydantic models
│   │   ├── db.py         # Database connection and utilities
│   │   └── __init__.py
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Backend Dockerfile
│
├── frontend/             # React frontend
│   ├── public/           # Static files
│   ├── src/              # React components
│   ├── package.json      # Node.js dependencies
│   └── Dockerfile        # Frontend Dockerfile
│
├── data/                 # Data files
├── docker-compose.yml    # Docker Compose configuration
└── README.md            # This file
```

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
