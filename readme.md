# Cluster Load Balancing Simulator

[![GitHub stars](https://img.shields.io/github/stars/alissonvg/cluster-load-balancing-simulator?style=social)](https://github.com/alissonvg/cluster-load-balancing-simulator/stargazers)
[![GitHub license](https://img.shields.io/github/license/alissonvg/cluster-load-balancing-simulator)](https://github.com/alissonvg/cluster-load-balancing-simulator/blob/main/LICENSE)

A simple and interactive simulation of load balancing in heterogeneous server clusters, made in JavaScript with Canvas. Gives a basic comparison of algorithms like **Least Remaining Time** (LRT) and **Shortest Queue** (SQ), with metrics calculated in real time, such as average wait time, throughput, and CPU usage.

This is a tool for visually understanding scheduling concepts in distributed systems and cloud computing, developed as a personal project.

[Online Demo](https://alissonvg.github.io/cluster-load-balancing-simulator/) (hosted via GitHub Pages)

![Demo Image](demo-screenshot.png) <!-- Add a GIF or screenshot here -->

## Features
- **Real-Time Visualization**: See tasks arriving, queuing, and processing on servers with different speeds (small, medium, large, xlarge).
- **Comparable Algorithms**: Toggle between LRT (based on expected delay) and SQ (shortest queue, with tie-break by speed).
- **Modes**:
  - **Sandbox**: Testing with sliders for arrival interval, processing time and algorithm which can be toggled in real time.
  - **Benchmark**: Fixed parameters, choose number of tasks (50/100/200); runs to completion and generates CSV (TaskID, WaitTime, Server, etc.).
- **Metrics**: Avg Wait Time (s), Throughput (tasks/min), Avg CPU (%), Cluster Load (%).
- **Logs and Export**: Automatic CSV export in benchmark for analysis (e.g., in Excel or Python).

## How to Run
### Locally
1. Clone the repository: `git clone https://github.com/alissonvg/cluster-load-balancing-simulator.git`
2. Open `index.html` in a browser (Tested in Chrome andFirefox).
3. Choose mode: Sandbox for free tests or Benchmark for controlled experiments.

### Online
- Access the [demo](https://alissonvg.github.io/cluster-load-balancing-simulator/) directly.

No server or installation required everything runs in the browser.

## Usage
### Sandbox Mode
- Adjust sliders for arrival interval (frames) and base processing time.
- Toggle algorithm to compare impacts on metrics.
- Reset to restart the simulation.

### Benchmark Mode
- Set fixed parameters (sliders and algorithm).
- Choose number of tasks (50/100/200).
- Run: Simulation stops after all tasks complete and downloads a CSV automatically.

## Algorithms Included (so far)
- **Least Remaining Time (LRT)**: Chooses server with lowest expected delay (remaining time + queue * avg process time). A basic optimization for heterogeneous clusters.
- **Shortest Queue (SQ)**: Chooses shortest queue (tie-break by faster server). Simple but less efficient with varying speeds.

Key Equations:
- Expected Delay = Remaining Time + Queue Length × Avg Process Time
- Throughput = Completed Tasks / (Simulated Time / 60)

## Technologies
- JavaScript (ES6+)
- HTML5 Canvas for visualization and animations
- CSS3 for UI (responsive dark theme)
- No external dependencies (except Font Awesome for icons)

## Contributions
- Fork the repo and send a Pull Request with improvements (e.g., new algorithms like Round Robin, server failure support).
- Issues welcome for bugs or suggestions.

## License
MIT License - see [LICENSE](LICENSE) for details.

Developed by [Alisson Gauer](https://github.com/alissonvg) in 2026. Inspired by real-world cloud infrastructure experiences at Dell Technologies.