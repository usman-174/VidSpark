# ML Server Setup Instructions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ml-server
python -m venv venv 
   venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000