# 🧠 ML Server Setup Instructions

## 🚀 Quick Start

Follow these steps to set up and run the ML server locally:

### 1. Clone the Repository

```bash
git clone <repo-url>
cd ml-server
```

### 2. Create and Activate a Virtual Environment (Windows)

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Server

```bash
python -m uvicorn server:app --reload --host 0.0.0.0 --port 7000
```
