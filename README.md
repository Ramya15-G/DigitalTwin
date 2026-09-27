
🏭 Digital Twin for Smart Manufacturing
Simulation-Based Production Bottleneck Analysis System

A simulation-based Digital Twin that models a small factory, monitors production performance, identifies bottlenecks, and allows users to test production changes through What-If scenarios.

🎯 Problem

Small factories often face bottlenecks due to limited machines, operators, processing capacity, and production delays.

Testing changes directly in the real factory can be costly and may interrupt production.

This project provides a virtual factory environment where production changes can be tested before applying them to the real system.

💡 Solution

The system creates a virtual representation of a factory production line and simulates its behaviour.

It helps users:

Monitor production performance
Identify bottleneck stations
Analyze machine and operator utilization
Track queues and WIP
Test different production scenarios
Compare results before and after changes
🔄 How It Works

Factory Data
↓
Digital Factory Model
↓
Production Simulation
↓
Performance Analysis
↓
Bottleneck Detection
↓
What-If Scenarios
↓
Result Comparison

✨ Features
📊 Production Dashboard

Provides a quick view of key production metrics:

Throughput
Lead Time
Jobs Completed
WIP
Operator Utilization
Station Utilization
Queue Status
🏭 Factory Floor

Represents the production flow:

Cutting → Machining → Assembly → Inspection → Packing

⚙️ Configuration

Allows production parameters to be configured:

Machines
Operators
Processing Time
Shift Duration
Production Parameters
🔍 Bottleneck Detection

Identifies production constraints using:

Station Utilization
Queue Length
Waiting Time
Throughput
🔄 What-If Analysis

Test production changes without modifying the real factory.

Examples:

Add a machine
Add an operator
Reduce processing time
Change batch size
Modify shift parameters
📈 Analytics

Compare simulation results and understand how different production decisions affect overall performance.

📌 Key Performance Indicators
KPI	Purpose
Throughput	Production output
Lead Time	Total production time
WIP	Work-in-progress
Utilization	Resource usage
Queue Length	Waiting at stations
Waiting Time	Production delays
🖥️ Dashboard Preview

🧩 System Architecture

Factory Inputs
↓
Digital Twin Model
↓
Production Simulation
↓
Performance Analysis
↓
Bottleneck Detection
↓
What-If Analysis
↓
Result Comparison

🛠️ Technology Stack
Technology	Purpose
Python	Core application logic
Flask	Web application backend
Flask-CORS	API communication
SimPy	Production simulation
NumPy	Numerical computation
HTML	Frontend structure
CSS	UI styling
JavaScript	Frontend interaction
📁 Project Structure

DigitalTwin/
├── app.py
├── requirements.txt
├── START.bat
├── static/
├── templates/
└── .vscode/

🚀 Quick Start
Prerequisites
Python 3.11
Git
Installation

git clone https://github.com/Ramya15-G/DigitalTwin.git

cd DigitalTwin

py -3.11 -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

Run

python app.py

Open:

http://127.0.0.1:5000

🔬 Example Use Case

Factory production flow:

Raw Material
↓
Cutting
↓
Machining
↓
Assembly
↓
Inspection
↓
Packing

If Machining has higher processing time and queue length, the system identifies it as a potential bottleneck.

The user can then test:

Current System
↓
Identify Bottleneck
↓
Add Machine / Operator
↓
Run Simulation
↓
Compare Results

🎯 Objectives
Simulate small-scale factory production
Identify production bottlenecks
Monitor key performance indicators
Evaluate resource utilization
Support What-If analysis
Reduce trial-and-error in real production
🔮 Future Scope
IoT-based real-time factory data
Live machine monitoring
Predictive maintenance
AI-assisted production optimization
Real-time Digital Twin synchronization
Advanced production forecasting
📌 Project Information

Problem Statement: TNI26037
Domain: Smart Manufacturing
Focus: Digital Twin & Production Simulation
Application: Production Bottleneck Analysis

👩‍💻 Author

Ramya G

GitHub: https://github.com/Ramya15-G

LinkedIn: https://linkedin.com/in/ramya1512

📄 License

This project is developed for academic and educational purposes.
