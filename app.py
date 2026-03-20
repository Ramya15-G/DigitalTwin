"""
Digital Twin Factory Simulation - Backend
Discrete-Event Simulation using SimPy
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import simpy
import random
import numpy as np
from collections import defaultdict
import json

app = Flask(__name__)
CORS(app)

# Global simulation results storage
simulation_results = {
    'baseline': None,
    'whatif': None
}

class FactorySimulation:
    """Main simulation class for the digital twin factory"""
    
    def __init__(self, config):
        self.config = config
        self.env = simpy.Environment()
        
        # Statistics tracking
        self.stats = {
            'throughput': 0,
            'total_lead_times': [],
            'wip_over_time': [],
            'queue_lengths': defaultdict(list),
            'utilization': defaultdict(list),
            'bottlenecks': [],
            'station_stats': defaultdict(lambda: {
                'processed': 0,
                'total_process_time': 0,
                'total_wait_time': 0,
                'busy_time': 0
            })
        }
        
        # Create resources
        self.operators = simpy.Resource(self.env, capacity=config['num_operators'])
        self.stations = {}
        for station in config['stations']:
            self.stations[station['name']] = {
                'resource': simpy.Resource(self.env, capacity=station['num_machines']),
                'buffer': simpy.Store(self.env, capacity=station['buffer_capacity']),
                'config': station
            }
        
        # Product tracking
        self.products_completed = []
        self.products_in_system = []
        self.current_wip = 0
        
    def product_generator(self):
        """Generate products entering the system"""
        product_id = 0
        while True:
            # Inter-arrival time based on demand rate
            inter_arrival = np.random.exponential(self.config['demand_rate'])
            yield self.env.timeout(inter_arrival)
            
            product_id += 1
            product = {
                'id': product_id,
                'type': random.choice(self.config['product_types']),
                'arrival_time': self.env.now,
                'completion_time': None,
                'route': self.config['production_route']
            }
            
            self.products_in_system.append(product)
            self.current_wip += 1
            self.env.process(self.product_flow(product))
    
    def product_flow(self, product):
        """Process a single product through the production line"""
        for station_name in product['route']:
            station = self.stations[station_name]
            station_config = station['config']
            
            # Wait in buffer
            buffer_entry_time = self.env.now
            yield station['buffer'].put(product)
            
            # Wait for operator and machine
            with self.operators.request() as operator_req, \
                 station['resource'].request() as machine_req:
                
                yield operator_req & machine_req
                
                # Calculate wait time
                wait_time = self.env.now - buffer_entry_time
                self.stats['station_stats'][station_name]['total_wait_time'] += wait_time
                
                # Get product back from buffer
                yield station['buffer'].get()
                
                # Setup time
                if station_config['setup_time'] > 0:
                    yield self.env.timeout(station_config['setup_time'])
                
                # Process time with some variation
                process_time = np.random.normal(
                    station_config['process_time'], 
                    station_config['process_time'] * 0.1
                )
                process_time = max(0.1, process_time)  # Ensure positive
                
                # Simulate machine failure
                failure_chance = random.random()
                if failure_chance < station_config['failure_rate']:
                    repair_time = np.random.exponential(station_config['repair_time'])
                    yield self.env.timeout(repair_time)
                
                # Actual processing
                process_start = self.env.now
                yield self.env.timeout(process_time)
                
                # Update statistics
                self.stats['station_stats'][station_name]['processed'] += 1
                self.stats['station_stats'][station_name]['total_process_time'] += process_time
                self.stats['station_stats'][station_name]['busy_time'] += (self.env.now - process_start)
        
        # Product completed
        product['completion_time'] = self.env.now
        lead_time = product['completion_time'] - product['arrival_time']
        self.stats['total_lead_times'].append(lead_time)
        self.products_completed.append(product)
        self.current_wip -= 1
        self.stats['throughput'] += 1
    
    def monitor(self):
        """Monitor system statistics during simulation"""
        while True:
            yield self.env.timeout(self.config['monitor_interval'])
            
            # Record WIP
            self.stats['wip_over_time'].append({
                'time': self.env.now,
                'wip': self.current_wip
            })
            
            # Record queue lengths
            for station_name, station in self.stations.items():
                queue_length = len(station['buffer'].items)
                self.stats['queue_lengths'][station_name].append({
                    'time': self.env.now,
                    'length': queue_length
                })
            
            # Calculate utilization
            for station_name, stats in self.stats['station_stats'].items():
                if self.env.now > 0:
                    station = self.stations[station_name]
                    num_machines = station['config']['num_machines']
                    utilization = (stats['busy_time'] / (self.env.now * num_machines)) * 100
                    self.stats['utilization'][station_name].append({
                        'time': self.env.now,
                        'utilization': min(100, utilization)
                    })
    
    def run(self, duration):
        """Run the simulation"""
        self.env.process(self.product_generator())
        self.env.process(self.monitor())
        self.env.run(until=duration)
        self.analyze_bottlenecks()
        return self.get_results()
    
    def analyze_bottlenecks(self):
        """Detect bottlenecks based on utilization and queue lengths"""
        bottleneck_scores = {}
        
        for station_name, stats in self.stats['station_stats'].items():
            if self.env.now > 0:
                station = self.stations[station_name]
                num_machines = station['config']['num_machines']
                
                # Calculate metrics
                avg_utilization = (stats['busy_time'] / (self.env.now * num_machines)) * 100
                avg_queue = np.mean([q['length'] for q in self.stats['queue_lengths'][station_name]]) if self.stats['queue_lengths'][station_name] else 0
                avg_wait = stats['total_wait_time'] / max(1, stats['processed'])
                
                # Bottleneck score (weighted combination)
                score = (avg_utilization * 0.5) + (avg_queue * 10) + (avg_wait * 0.2)
                
                bottleneck_scores[station_name] = {
                    'score': score,
                    'utilization': avg_utilization,
                    'avg_queue': avg_queue,
                    'avg_wait': avg_wait
                }
        
        # Sort and identify top bottlenecks
        sorted_bottlenecks = sorted(
            bottleneck_scores.items(), 
            key=lambda x: x[1]['score'], 
            reverse=True
        )
        
        self.stats['bottlenecks'] = [
            {
                'station': name,
                'score': data['score'],
                'utilization': round(data['utilization'], 2),
                'avg_queue': round(data['avg_queue'], 2),
                'avg_wait': round(data['avg_wait'], 2),
                'is_primary': i == 0
            }
            for i, (name, data) in enumerate(sorted_bottlenecks)
        ]
    
    def get_results(self):
        """Compile and return simulation results"""
        avg_lead_time = np.mean(self.stats['total_lead_times']) if self.stats['total_lead_times'] else 0
        throughput_per_hour = self.stats['throughput'] / (self.env.now / 60) if self.env.now > 0 else 0
        
        # Calculate final utilization for each station
        station_utilization = {}
        for station_name, stats in self.stats['station_stats'].items():
            if self.env.now > 0:
                station = self.stations[station_name]
                num_machines = station['config']['num_machines']
                utilization = (stats['busy_time'] / (self.env.now * num_machines)) * 100
                station_utilization[station_name] = round(min(100, utilization), 2)
        
        return {
            'throughput': round(throughput_per_hour, 2),
            'avg_lead_time': round(avg_lead_time, 2),
            'total_produced': self.stats['throughput'],
            'station_utilization': station_utilization,
            'bottlenecks': self.stats['bottlenecks'],
            'wip_over_time': self.stats['wip_over_time'][::5],  # Sample every 5th point
            'queue_lengths': {
                station: lengths[::5] for station, lengths in self.stats['queue_lengths'].items()
            },
            'utilization_over_time': {
                station: utils[::5] for station, utils in self.stats['utilization'].items()
            }
        }


def get_default_config():
    """Get default factory configuration"""
    return {
        'stations': [
            {
                'name': 'Cutting',
                'process_time': 5.0,
                'setup_time': 0.5,
                'num_machines': 1,
                'buffer_capacity': 10,
                'failure_rate': 0.05,
                'repair_time': 10.0
            },
            {
                'name': 'Machining',
                'process_time': 8.0,
                'setup_time': 1.0,
                'num_machines': 1,
                'buffer_capacity': 8,
                'failure_rate': 0.08,
                'repair_time': 15.0
            },
            {
                'name': 'Assembly',
                'process_time': 10.0,
                'setup_time': 0.5,
                'num_machines': 1,
                'buffer_capacity': 6,
                'failure_rate': 0.03,
                'repair_time': 8.0
            },
            {
                'name': 'Inspection',
                'process_time': 4.0,
                'setup_time': 0.2,
                'num_machines': 1,
                'buffer_capacity': 8,
                'failure_rate': 0.02,
                'repair_time': 5.0
            },
            {
                'name': 'Packing',
                'process_time': 3.0,
                'setup_time': 0.3,
                'num_machines': 1,
                'buffer_capacity': 10,
                'failure_rate': 0.01,
                'repair_time': 3.0
            }
        ],
        'num_operators': 3,
        'product_types': ['Product-A', 'Product-B'],
        'production_route': ['Cutting', 'Machining', 'Assembly', 'Inspection', 'Packing'],
        'demand_rate': 5.0,  # Average time between arrivals
        'simulation_duration': 480,  # 8 hours in minutes
        'monitor_interval': 10  # Monitor every 10 minutes
    }


@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify(get_default_config())


@app.route('/api/simulate', methods=['POST'])
def simulate():
    """Run simulation with given configuration"""
    try:
        config = request.json
        scenario_type = config.pop('scenario_type', 'baseline')
        
        # Merge with defaults
        full_config = get_default_config()
        
        # Update stations
        if 'stations' in config:
            for i, station_update in enumerate(config['stations']):
                if i < len(full_config['stations']):
                    full_config['stations'][i].update(station_update)
        
        # Update other parameters
        for key in ['num_operators', 'demand_rate', 'simulation_duration']:
            if key in config:
                full_config[key] = config[key]
        
        # Run simulation
        sim = FactorySimulation(full_config)
        results = sim.run(full_config['simulation_duration'])
        
        # Store results
        simulation_results[scenario_type] = results
        
        return jsonify({
            'success': True,
            'results': results,
            'scenario_type': scenario_type
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compare', methods=['GET'])
def compare_scenarios():
    """Compare baseline and what-if scenarios"""
    if simulation_results['baseline'] and simulation_results['whatif']:
        comparison = {
            'baseline': simulation_results['baseline'],
            'whatif': simulation_results['whatif'],
            'improvements': {
                'throughput': simulation_results['whatif']['throughput'] - simulation_results['baseline']['throughput'],
                'lead_time': simulation_results['baseline']['avg_lead_time'] - simulation_results['whatif']['avg_lead_time']
            }
        }
        return jsonify(comparison)
    else:
        return jsonify({
            'error': 'Both baseline and what-if scenarios must be run first'
        }), 400


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
