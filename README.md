 Digital Twin for Smart Manufacturing

🏭 **Simulation-Based Production Bottleneck Analysis System**

A simulation-based Digital Twin that models a small factory production system, monitors performance, identifies bottlenecks, and allows users to test production changes through What-If scenarios before applying them to the real factory.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11
- Windows / Linux / macOS
- Modern web browser

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Ramya15-G/DigitalTwin.git
cd DigitalTwin
Create virtual environment
py -3.11 -m venv venv
Activate virtual environment
Windows
venv\Scripts\activate
Linux / macOS
source venv/bin/activate
Install dependencies
pip install -r requirements.txt
Run the application
python app.py
Open the dashboard
http://127.0.0.1:5000
🎯 Problem

Small manufacturing systems contain multiple interconnected production stages such as:

Cutting
   ↓
Machining
   ↓
Assembly
   ↓
Inspection
   ↓
Packing

When one stage becomes slower than the others, it can create queues, increase waiting time, reduce throughput, and affect the overall production process.

The main challenge is that testing changes directly in a real factory can be costly and disruptive.

For example:

Should another machine be added?
Should more operators be assigned?
What happens if processing time changes?
What happens if production conditions change?
Which change improves the overall production performance?

A factory needs a safer way to test these scenarios before implementing them.

💡 Solution

This project creates a Digital Twin of the production system using discrete-event simulation.

The virtual factory represents production stages, resources, processing times, queues and production flow.

Real Factory
     ↓
Production Parameters
     ↓
Digital Model
     ↓
Simulation
     ↓
Performance Analysis
     ↓
Bottleneck Detection
     ↓
What-If Scenarios
     ↓
Result Comparison

Instead of changing the real production system first, possible changes can be tested inside the simulated environment.

✨ Features
📊 Production Dashboard

Provides a centralized view of the factory's current simulation performance.

Throughput
Average Lead Time
Jobs Completed
Total WIP
Operator Utilization
Simulation Time
Station Utilization
Queue information
Bottleneck scores
🏭 Factory Floor

Provides a visual representation of the simulated production environment and its manufacturing stations.

⚙️ Configuration

Allows production parameters and simulation conditions to be configured before running the model.

🔮 What-If Analysis

Allows users to test hypothetical production changes and observe their possible effect on factory performance.

Example:

Current Factory
      ↓
Identify Bottleneck
      ↓
Change Production Parameter
      ↓
Run Simulation
      ↓
Analyze Results
      ↓
Compare Performance
📈 Analytics

Provides visual analysis of production performance through charts and metrics.

🚨 Bottleneck Analysis

Helps identify stations with higher production constraints using indicators such as:

Resource utilization
Queue length
Waiting time
Throughput
WIP
▶️ Simulation Controls

The dashboard provides controls to:

Start simulation
Pause simulation
Stop simulation
Reset simulation
Adjust simulation speed
📸 Dashboard Preview

The dashboard provides an overview of production performance, station utilization, lead-time distribution and bottleneck scores.

🔮 What-If Analysis

The What-If module is used to experiment with hypothetical production changes.

A scenario can be configured and simulated without modifying the actual factory.

Existing Production System
          ↓
      Select Scenario
          ↓
    Modify Parameter
          ↓
      Run Simulation
          ↓
     Observe Metrics
          ↓
    Analyze Difference

This provides a way to explore possible production improvements before making physical changes.

📊 Key Performance Indicators
Metric	Description
Throughput	Production output achieved by the system
Average Lead Time	Average time taken by jobs through the production system
Jobs Completed	Number of completed production jobs
WIP	Work-In-Progress currently inside the system
Operator Utilization	Percentage of available operator capacity being used
Queue Length	Jobs waiting at production stations
Station Utilization	Utilization level of individual production stations
🏗️ System Architecture
┌──────────────────────────────┐
│          Web Dashboard       │
│      HTML / CSS / JavaScript │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│        Flask Backend         │
│       Application Logic      │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│       SimPy Simulation       │
│     Production Model         │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│      Production Metrics      │
│  KPIs / Queues / Bottlenecks │
└──────────────────────────────┘
📁 Project Structure
DigitalTwin/
│
├── .vscode/
│
├── static/
│   └── ...
│
├── templates/
│   └── ...
│
├── app.py
├── requirements.txt
├── START.bat
└── README.md
🛠️ Technology Stack
Backend
Python – Core programming language
Flask – Web application framework
Flask-CORS – Cross-origin request handling
Simulation
SimPy – Discrete-event production simulation
NumPy – Numerical processing
Frontend
HTML
CSS
JavaScript
⚙️ How It Works

The simulation models the movement of production jobs through different manufacturing stations.

Production Input
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
       ↓
Finished Product

During simulation, the system tracks production behaviour and calculates performance indicators.

These results are then visualized through the web dashboard.

🧠 Bottleneck Identification

A production station can become a constraint when it cannot keep up with the required production flow.

The system provides multiple indicators to understand these constraints.

High Utilization
       +
Long Queue
       +
High Waiting Time
       ↓
Potential Bottleneck
       ↓
Further Analysis

Example dashboard output:

Cutting       53%
Machining     65%
Assembly      56%
Inspection    17%
Packing        9%

The values shown above are simulation outputs and can change depending on the configured scenario.

🎥 Demo

The project includes a short walkthrough demonstrating:

Dashboard
    ↓
Factory Floor
    ↓
Configuration
    ↓
What-If Analysis
    ↓
Analytics

Add the project demo video or GitHub-hosted video link here.

📦 Dependencies

The project currently uses:

Flask 3.0.0 – Web application framework
Flask-CORS 4.0.0 – CORS support
SimPy 4.1.1 – Discrete-event simulation
NumPy 1.26.2 – Numerical computation

Install all dependencies using:

pip install -r requirements.txt
🧪 Example Use Case

Consider a factory where machining becomes a bottleneck.

Instead of immediately purchasing another machine:

Current Factory
       ↓
Machining Bottleneck
       ↓
Create What-If Scenario
       ↓
Modify Production Condition
       ↓
Run Simulation
       ↓
Check Throughput
       ↓
Check Lead Time
       ↓
Check WIP
       ↓
Compare Results

The simulation can help understand the possible effect of the change before implementing it physically.

🎯 Project Objectives
Identify production bottlenecks
Monitor production performance
Understand resource utilization
Analyze queues and WIP
Experiment with production scenarios
Compare possible changes
Support data-informed production decisions
🔮 Future Scope

The current system focuses on simulation-based production analysis.

Future development can extend the Digital Twin towards:

Manual Factory Data
        ↓
    Digital Twin
        ↓
   Real-Time IoT
        ↓
 Predictive Analytics
        ↓
 AI-Based Optimization

Potential extensions include:

Real-time IoT sensor integration
Live machine data
Predictive maintenance
Demand forecasting
Automated scenario comparison
Advanced production optimization
AI-assisted decision support
🏆 Project Information

Problem Statement: TNI26037

Domain: Smart Manufacturing / Industry 4.0

Project Type: Digital Twin & Production Simulation

The project focuses on simulating manufacturing operations to understand production bottlenecks and evaluate possible improvements in a virtual environment.
