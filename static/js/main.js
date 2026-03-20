// Global state
let currentConfig = null;
let simulationRunning = false;
let simulationData = null;
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupControls();
    loadConfiguration();
    initializeCharts();
});

// Tab System
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Setup Controls
function setupControls() {
    // Control buttons
    document.getElementById('start-btn').addEventListener('click', startSimulation);
    document.getElementById('pause-btn').addEventListener('click', pauseSimulation);
    document.getElementById('stop-btn').addEventListener('click', stopSimulation);
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);
    
    // Sim speed control
    const simSpeedSlider = document.getElementById('sim-speed');
    const speedDisplay = document.getElementById('speed-display');
    simSpeedSlider.addEventListener('input', function() {
        speedDisplay.textContent = this.value + 'x';
    });
    
    // Configuration buttons
    document.getElementById('save-config-btn')?.addEventListener('click', saveConfiguration);
    document.getElementById('load-default-btn')?.addEventListener('click', loadConfiguration);
    
    // What-if buttons
    document.getElementById('run-baseline-btn')?.addEventListener('click', runBaseline);
    document.getElementById('run-whatif-scenario-btn')?.addEventListener('click', runWhatIfScenario);
    document.getElementById('compare-scenarios-btn')?.addEventListener('click', compareScenarios);
}

// Load configuration from backend
async function loadConfiguration() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        currentConfig = config;
        
        // Update configuration tab (use backend field names with fallbacks)
        const simTimeEl = document.getElementById('config-sim-time');
        const arrivalRateEl = document.getElementById('config-arrival-rate');
        if (simTimeEl) simTimeEl.value = config.simulation_duration || config.simulation_time || 480;
        if (arrivalRateEl) arrivalRateEl.value = config.demand_rate || config.arrival_rate || 5;
        
        renderStationConfig(config.stations);
        renderFactoryFloor(config.stations);
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

// Station icons for display
const stationIcons = {
    'Cutting': '✂️',
    'Machining': '⚙️',
    'Assembly': '🔧',
    'Inspection': '🔍',
    'Packing': '📦'
};

// Render station configuration
function renderStationConfig(stations) {
    const container = document.getElementById('station-config-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Handle both array and object formats
    const stationArray = Array.isArray(stations) ? stations : Object.values(stations);
    
    stationArray.forEach((station, index) => {
        const name = station.name || Object.keys(stations)[index];
        const icon = stationIcons[name] || '🏭';
        
        const stationDiv = document.createElement('div');
        stationDiv.className = 'station-config-item';
        stationDiv.innerHTML = `
            <div class="station-config-header">
                <span class="station-config-icon">${icon}</span>
                <span class="station-config-name">${name}</span>
            </div>
            <div class="station-config-params">
                <div class="param-group">
                    <label for="cfg-machines-${name}">Machines:</label>
                    <input type="number" 
                           id="cfg-machines-${name}" 
                           value="${station.num_machines || station.machines}" 
                           min="1" 
                           max="10"
                           onchange="updateStationConfig('${name}', 'num_machines', this.value)">
                </div>
                <div class="param-group">
                    <label for="cfg-time-${name}">Process Time (min):</label>
                    <input type="number" 
                           id="cfg-time-${name}" 
                           value="${station.process_time}" 
                           min="1" 
                           max="60"
                           onchange="updateStationConfig('${name}', 'process_time', this.value)">
                </div>
            </div>
        `;
        container.appendChild(stationDiv);
    });
}

// Render factory floor
function renderFactoryFloor(stations) {
    const container = document.getElementById('factory-floor-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Handle both array and object formats
    const stationArray = Array.isArray(stations) ? stations : Object.values(stations);
    
    stationArray.forEach(station => {
        const name = station.name;
        const icon = stationIcons[name] || '🏭';
        const stationCard = document.createElement('div');
        stationCard.className = 'station-card';
        stationCard.innerHTML = `
            <div class="station-header">
                <div class="station-name">${icon} ${name}</div>
            </div>
            <div class="station-stats">
                <div class="stat-row">
                    <span class="stat-label">Machines</span>
                    <span class="stat-value">${station.num_machines || station.machines}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Busy</span>
                    <span class="stat-value" id="floor-busy-${name}">0</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Queue</span>
                    <span class="stat-value" id="floor-queue-${name}">0</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Done</span>
                    <span class="stat-value" id="floor-processed-${name}">0</span>
                </div>
            </div>
            <div class="progress-circle">
                <svg width="120" height="120">
                    <circle cx="60" cy="60" r="55" fill="none" stroke="var(--border-color)" stroke-width="8" />
                    <circle cx="60" cy="60" r="55" fill="none" stroke="var(--primary-color)" stroke-width="8" 
                            stroke-dasharray="345" stroke-dashoffset="345" id="progress-${name}" style="transition: stroke-dashoffset 0.3s ease;" />
                </svg>
                <div class="progress-circle-text">
                    <div class="progress-circle-value" id="util-value-${name}">0%</div>
                    <div class="progress-circle-label">Util.</div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 16px;">
                <div class="station-status status-idle" id="floor-status-${name}">● Status: IDLE</div>
            </div>
            <div style="text-align: center; margin-top: 12px; font-size: 0.8rem; color: var(--text-secondary);">
                Buffer <span id="buffer-${name}">0</span>/10
            </div>
        `;
        container.appendChild(stationCard);
    });
}

// Update station configuration
function updateStationConfig(stationName, param, value) {
    if (currentConfig && currentConfig.stations) {
        // Handle array format
        if (Array.isArray(currentConfig.stations)) {
            const station = currentConfig.stations.find(s => s.name === stationName);
            if (station) {
                // Map num_machines to machines if needed
                const paramKey = param === 'num_machines' ? 'num_machines' : param;
                station[paramKey] = parseFloat(value);
            }
        } else {
            // Handle object format (backward compatibility)
            if (currentConfig.stations[stationName]) {
                currentConfig.stations[stationName][param] = parseFloat(value);
            }
        }
    }
}

// Save configuration
function saveConfiguration() {
    currentConfig.simulation_time = parseFloat(document.getElementById('config-sim-time').value);
    currentConfig.arrival_rate = parseFloat(document.getElementById('config-arrival-rate').value);
    alert('Configuration saved!');
}

// Start simulation
async function startSimulation() {
    if (simulationRunning) return;
    
    simulationRunning = true;
    updateStatusIndicator('Running');
    
    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('Simulation error:', result.error);
            updateStatusIndicator('Error');
            return;
        }
        simulationData = result.results;
        displaySimulationResults(result.results);
        updateStatusIndicator('Completed');
    } catch (error) {
        console.error('Error running simulation:', error);
        updateStatusIndicator('Error');
    } finally {
        simulationRunning = false;
    }
}

// Pause simulation
function pauseSimulation() {
    if (simulationRunning) {
        simulationRunning = false;
        updateStatusIndicator('Paused');
    }
}

// Stop simulation
function stopSimulation() {
    simulationRunning = false;
    updateStatusIndicator('Stopped');
}

// Reset simulation
function resetSimulation() {
    simulationRunning = false;
    simulationData = null;
    
    // Reset metrics
    document.getElementById('throughput-value').textContent = '0';
    document.getElementById('lead-time-value').textContent = '0';
    document.getElementById('jobs-completed-value').textContent = '0';
    document.getElementById('wip-value').textContent = '0';
    document.getElementById('operator-util-value').textContent = '—';
    document.getElementById('sim-time-value').textContent = '0';
    document.getElementById('progress-value').textContent = '0%';
    
    // Reset charts
    if (charts.utilization) {
        charts.utilization.data.labels = [];
        charts.utilization.data.datasets[0].data = [];
        charts.utilization.data.datasets[1].data = [];
        charts.utilization.update();
    }
    
    if (charts.leadtime) {
        charts.leadtime.data.datasets[0].data = [];
        charts.leadtime.update();
    }
    
    if (charts.utilizationTimeline) {
        charts.utilizationTimeline.data.labels = [];
        charts.utilizationTimeline.data.datasets[0].data = [];
        charts.utilizationTimeline.update();
    }
    
    if (charts.wipTimeline) {
        charts.wipTimeline.data.labels = [];
        charts.wipTimeline.data.datasets[0].data = [];
        charts.wipTimeline.update();
    }
    
    if (charts.throughput) {
        charts.throughput.data.labels = [];
        charts.throughput.data.datasets[0].data = [];
        charts.throughput.update();
    }
    
    // Reset factory floor
    if (currentConfig) {
        const stationArray = Array.isArray(currentConfig.stations) ? currentConfig.stations : Object.values(currentConfig.stations);
        stationArray.forEach(station => {
            const stationName = station.name;
            const statusEl = document.getElementById(`floor-status-${stationName}`);
            const utilEl = document.getElementById(`util-value-${stationName}`);
            const queueEl = document.getElementById(`floor-queue-${stationName}`);
            const processedEl = document.getElementById(`floor-processed-${stationName}`);
            const busyEl = document.getElementById(`floor-busy-${stationName}`);
            const bufferEl = document.getElementById(`buffer-${stationName}`);
            const progressEl = document.getElementById(`progress-${stationName}`);
            
            if (statusEl) {
                statusEl.textContent = '● Status: IDLE';
                statusEl.className = 'station-status status-idle';
            }
            if (utilEl) utilEl.textContent = '0%';
            if (queueEl) queueEl.textContent = '0';
            if (processedEl) processedEl.textContent = '0';
            if (busyEl) busyEl.textContent = '0';
            if (bufferEl) bufferEl.textContent = '0';
            if (progressEl) {
                progressEl.setAttribute('stroke-dashoffset', '345');
                progressEl.setAttribute('stroke', '#3b82f6');
            }
        });
    }
    
    // Reset bottleneck list
    document.getElementById('bottleneck-list').innerHTML = '';
    
    // Reset what-if results
    document.getElementById('whatif-results').innerHTML = '<p class="placeholder-text">Run both scenarios to see comparison</p>';
    
    updateStatusIndicator('Idle');
    loadConfiguration();
}

// Display simulation results
function displaySimulationResults(result) {
    // result fields from backend: throughput, avg_lead_time, total_produced, station_utilization, bottlenecks
    const throughput = (result.throughput || 0).toFixed(2);
    document.getElementById('throughput-value').textContent = throughput;
    document.getElementById('lead-time-value').textContent = (result.avg_lead_time || 0).toFixed(0);
    document.getElementById('jobs-completed-value').textContent = result.total_produced || 0;
    document.getElementById('wip-value').textContent = calculateWIP(result.station_utilization);
    
    // Avg utilization across stations
    const utilValues = Object.values(result.station_utilization || {});
    const avgUtil = utilValues.length ? utilValues.reduce((a, b) => a + b, 0) / utilValues.length : 0;
    document.getElementById('operator-util-value').textContent = avgUtil.toFixed(0);
    
    const simDuration = currentConfig.simulation_duration || currentConfig.simulation_time || 480;
    document.getElementById('sim-time-value').textContent = simDuration;
    document.getElementById('progress-value').textContent = '100%';
    
    // Update charts
    updateUtilizationChart(result.station_utilization);
    updateLeadTimeChart(result);
    
    // Update factory floor
    updateFactoryFloor(result.station_utilization, result);
    
    // Update bottleneck list
    updateBottleneckList(result.bottlenecks);
    
    // Update analytics table
    updateAnalyticsTable(result.station_utilization, result);
}

// Calculate WIP
function calculateWIP(stationUtilization) {
    // WIP approximation: count stations with utilization > 50%
    if (!stationUtilization) return 0;
    return Object.values(stationUtilization).filter(u => u > 50).length;
}

// Update status indicator
function updateStatusIndicator(status) {
    const indicator = document.querySelector('.status-indicator');
    indicator.textContent = status;
    
    // Color coding
    indicator.style.color = status === 'Running' ? '#10b981' :
                           status === 'Error' ? '#ef4444' :
                           status === 'Completed' ? '#3b82f6' : '#94a3b8';
}

// Initialize charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#94a3b8'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(45, 55, 72, 0.5)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            },
            x: {
                grid: {
                    color: 'rgba(45, 55, 72, 0.5)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    };
    
    // Utilization Chart
    const utilizationCtx = document.getElementById('utilization-chart').getContext('2d');
    charts.utilization = new Chart(utilizationCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Utilization',
                    data: [],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                },
                {
                    label: 'Queue',
                    data: [],
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }
            ]
        },
        options: chartOptions
    });
    
    // Lead Time Chart
    const leadtimeCtx = document.getElementById('leadtime-chart').getContext('2d');
    charts.leadtime = new Chart(leadtimeCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => i * 5),
            datasets: [{
                label: 'Lead Time',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });
    
    // Utilization Over Time Chart
    const utilizationTimelineCtx = document.getElementById('utilization-timeline-chart')?.getContext('2d');
    if (utilizationTimelineCtx) {
        charts.utilizationTimeline = new Chart(utilizationTimelineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'System Utilization',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: chartOptions
        });
    }
    
    // WIP Over Time Chart
    const wipTimelineCtx = document.getElementById('wip-timeline-chart')?.getContext('2d');
    if (wipTimelineCtx) {
        charts.wipTimeline = new Chart(wipTimelineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Work in Progress',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: chartOptions
        });
    }
    
    // Throughput Chart
    const throughputCtx = document.getElementById('throughput-chart')?.getContext('2d');
    if (throughputCtx) {
        charts.throughput = new Chart(throughputCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Throughput (units/hr)',
                    data: [],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: chartOptions
        });
    }
}

// Update utilization chart
function updateUtilizationChart(stationUtilization) {
    if (!stationUtilization) return;
    const labels = Object.keys(stationUtilization);
    const utilizationData = labels.map(s => parseFloat(stationUtilization[s]).toFixed(1));
    
    charts.utilization.data.labels = labels;
    charts.utilization.data.datasets[0].data = utilizationData;
    charts.utilization.data.datasets[1].data = [];
    charts.utilization.update();
}

// Update lead time chart
function updateLeadTimeChart(result) {
    // Generate sample lead time distribution
    const data = Array.from({length: 20}, () => Math.random() * 100);
    charts.leadtime.data.datasets[0].data = data;
    charts.leadtime.update();
}

// Update factory floor
function updateFactoryFloor(stationUtilization, fullResult) {
    if (!stationUtilization) return;
    Object.entries(stationUtilization).forEach(([station, utilPct]) => {
        const statusEl = document.getElementById(`floor-status-${station}`);
        const utilEl = document.getElementById(`util-value-${station}`);
        const progressEl = document.getElementById(`progress-${station}`);
        const busyEl = document.getElementById(`floor-busy-${station}`);
        const utilFraction = utilPct / 100;
        
        if (statusEl) {
            if (utilFraction > 0.8) {
                statusEl.textContent = '● Status: BUSY';
                statusEl.className = 'station-status status-busy';
            } else if (utilFraction > 0.3) {
                statusEl.textContent = '● Status: ACTIVE';
                statusEl.className = 'station-status status-active';
            } else {
                statusEl.textContent = '● Status: IDLE';
                statusEl.className = 'station-status status-idle';
            }
        }
        
        if (utilEl) utilEl.textContent = utilPct.toFixed(0) + '%';
        
        // Update circular progress
        if (progressEl) {
            const circumference = 2 * Math.PI * 55;
            const offset = circumference - (utilFraction * circumference);
            progressEl.setAttribute('stroke-dashoffset', offset);
            progressEl.setAttribute('stroke',
                utilFraction > 0.8 ? '#ef4444' :
                utilFraction > 0.5 ? '#f59e0b' :
                '#3b82f6'
            );
        }
    });
}

// Update bottleneck list
function updateBottleneckList(bottlenecks) {
    const container = document.getElementById('bottleneck-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (!bottlenecks || !bottlenecks.length) return;
    
    bottlenecks.forEach(b => {
        const item = document.createElement('div');
        item.className = 'bottleneck-item';
        
        const utilFraction = b.utilization / 100;
        let scoreClass = 'score-low';
        if (utilFraction > 0.8) scoreClass = 'score-high';
        else if (utilFraction > 0.5) scoreClass = 'score-medium';
        
        const icon = stationIcons[b.station] || '🏭';
        item.innerHTML = `
            <span class="bottleneck-station">${icon} ${b.station}${b.is_primary ? ' ⚠️' : ''}</span>
            <span class="bottleneck-score ${scoreClass}">${b.utilization.toFixed(0)}%</span>
        `;
        container.appendChild(item);
    });
}

// Update analytics table
function updateAnalyticsTable(stationUtilization, fullResult) {
    const container = document.getElementById('analytics-table');
    if (!container || !stationUtilization) return;
    container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'analytics-row analytics-header';
    header.innerHTML = `
        <div class="analytics-cell">Station</div>
        <div class="analytics-cell">Utilization</div>
        <div class="analytics-cell">Avg Wait (queue)</div>
        <div class="analytics-cell">Status</div>
    `;
    container.appendChild(header);
    
    // Build lookup for bottleneck data
    const bnMap = {};
    (fullResult.bottlenecks || []).forEach(b => { bnMap[b.station] = b; });
    
    // Rows
    Object.entries(stationUtilization).forEach(([station, utilPct]) => {
        const bn = bnMap[station] || {};
        const icon = stationIcons[station] || '🏭';
        const utilFraction = utilPct / 100;
        let statusLabel = utilFraction > 0.8 ? '🔴 High Load' : utilFraction > 0.5 ? '🟡 Moderate' : '🟢 Normal';
        const row = document.createElement('div');
        row.className = 'analytics-row';
        row.innerHTML = `
            <div class="analytics-cell">${icon} ${station}</div>
            <div class="analytics-cell">${utilPct.toFixed(1)}%</div>
            <div class="analytics-cell">${bn.avg_wait ? bn.avg_wait.toFixed(1) + ' min' : '—'}</div>
            <div class="analytics-cell">${statusLabel}</div>
        `;
        container.appendChild(row);
    });
}

// Run what-if analysis
async function runWhatIfAnalysis() {
    const station = document.getElementById('whatif-station').value;
    const action = document.getElementById('whatif-action').value;
    
    if (!station) {
        alert('Please select a station to optimize');
        return;
    }
    
    try {
        // Create modified config
        const whatIfConfig = JSON.parse(JSON.stringify(currentConfig));
        
        // Handle array format
        if (Array.isArray(whatIfConfig.stations)) {
            const selectedStation = whatIfConfig.stations.find(s => s.name === station);
            if (selectedStation) {
                if (action === 'add_machine' || action === 'both') {
                    selectedStation.num_machines = (selectedStation.num_machines || selectedStation.machines || 1) + 1;
                }
                if (action === 'reduce_time' || action === 'both') {
                    selectedStation.process_time *= 0.8;
                }
            }
        } else {
            // Object format (backward compatibility)
            if (action === 'add_machine' || action === 'both') {
                whatIfConfig.stations[station].machines += 1;
            }
            if (action === 'reduce_time' || action === 'both') {
                whatIfConfig.stations[station].process_time *= 0.8;
            }
        }
        
        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current: currentConfig,
                whatif: whatIfConfig
            })
        });
        
        const comparison = await response.json();
        displayWhatIfResults(comparison, station, action);
    } catch (error) {
        console.error('Error running what-if analysis:', error);
    }
}

// Run baseline scenario
async function runBaseline() {
    await startSimulation();
}

// Run what-if scenario
async function runWhatIfScenario() {
    const station = document.getElementById('whatif-station').value;
    const action = document.getElementById('whatif-action').value;
    
    if (!station) {
        alert('Please select a station to optimize');
        return;
    }
    
    const whatIfConfig = JSON.parse(JSON.stringify(currentConfig));
    
    // Handle array format
    if (Array.isArray(whatIfConfig.stations)) {
        const selectedStation = whatIfConfig.stations.find(s => s.name === station);
        if (selectedStation) {
            if (action === 'add_machine' || action === 'both') {
                selectedStation.num_machines = (selectedStation.num_machines || selectedStation.machines || 1) + 1;
            }
            if (action === 'reduce_time' || action === 'both') {
                selectedStation.process_time *= 0.8;
            }
        }
    } else {
        // Object format (backward compatibility)
        if (action === 'add_machine' || action === 'both') {
            whatIfConfig.stations[station].machines += 1;
        }
        if (action === 'reduce_time' || action === 'both') {
            whatIfConfig.stations[station].process_time *= 0.8;
        }
    }
    
    try {
        simulationRunning = true;
        updateStatusIndicator('Running');
        
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(whatIfConfig)
        });
        
        const result = await response.json();
        alert('What-If scenario simulation completed. Run baseline to compare.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        simulationRunning = false;
    }
}

// Compare scenarios
function compareScenarios() {
    if (!simulationData) {
        alert('Please run baseline simulation first');
        return;
    }
    runWhatIfAnalysis();
}

// Display what-if results
function displayWhatIfResults(comparison, station, action) {
    const container = document.getElementById('whatif-results');
    
    const productImprovement = ((comparison.whatif.products_completed - comparison.current.products_completed) / comparison.current.products_completed * 100).toFixed(1);
    const throughputImprovement = ((comparison.current.avg_throughput_time - comparison.whatif.avg_throughput_time) / comparison.current.avg_throughput_time * 100).toFixed(1);
    
    let actionText = '';
    if (action === 'add_machine') actionText = 'Adding 1 machine';
    else if (action === 'reduce_time') actionText = 'Reducing process time by 20%';
    else actionText = 'Adding 1 machine and reducing process time by 20%';
    
    container.innerHTML = `
        <h4 style="color: #3b82f6; margin-bottom: 20px;">📊 Scenario: ${actionText} at ${station}</h4>
        
        <div class="comparison-grid">
            <div class="comparison-card">
                <h4>Current State</h4>
                <div class="comparison-metric">
                    <span class="comparison-label">Products Completed</span>
                    <span class="comparison-value">${comparison.current.products_completed}</span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Avg Throughput</span>
                    <span class="comparison-value">${comparison.current.avg_throughput_time.toFixed(1)} min</span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Efficiency</span>
                    <span class="comparison-value">${(comparison.current.avg_utilization * 100).toFixed(1)}%</span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Bottleneck</span>
                    <span class="comparison-value">${comparison.current.bottleneck.station}</span>
                </div>
            </div>
            
            <div class="comparison-card">
                <h4>What-If State</h4>
                <div class="comparison-metric">
                    <span class="comparison-label">Products Completed</span>
                    <span class="comparison-value">
                        ${comparison.whatif.products_completed}
                        <span class="improvement-badge improvement-positive">+${productImprovement}%</span>
                    </span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Avg Throughput</span>
                    <span class="comparison-value">
                        ${comparison.whatif.avg_throughput_time.toFixed(1)} min
                        <span class="improvement-badge improvement-positive">-${throughputImprovement}%</span>
                    </span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Efficiency</span>
                    <span class="comparison-value">${(comparison.whatif.avg_utilization * 100).toFixed(1)}%</span>
                </div>
                <div class="comparison-metric">
                    <span class="comparison-label">Bottleneck</span>
                    <span class="comparison-value">${comparison.whatif.bottleneck.station}</span>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 8px;">
            <p style="color: #94a3b8; line-height: 1.6;">
                <strong style="color: #10b981;">✅ Impact:</strong> This optimization would improve production by ${productImprovement}% 
                and reduce throughput time by ${throughputImprovement}%. 
                ${comparison.current.bottleneck.station !== comparison.whatif.bottleneck.station ? 
                    `The bottleneck would shift from ${comparison.current.bottleneck.station} to ${comparison.whatif.bottleneck.station}.` : 
                    'The bottleneck remains at the same station.'}
            </p>
        </div>
    `;
}
