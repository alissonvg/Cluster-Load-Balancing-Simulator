# Cluster Load Balancing Simulator

[![GitHub stars](https://img.shields.io/github/stars/alissonvg/Cluster-Load-Balancing-Simulator?style=social)](https://github.com/alissonvg/Cluster-Load-Balancing-Simulator/stargazers)
[![GitHub license](https://img.shields.io/github/license/alissonvg/Cluster-Load-Balancing-Simulator)](https://github.com/alissonvg/Cluster-Load-Balancing-Simulator/blob/main/LICENSE)

A simple and interactive simulation of load balancing in heterogeneous server clusters, built with JavaScript and Canvas. Gives a basic comparison of different algorithms like **Least Remaining Time** (LRT), **Shortest Queue** (SQ), **Round Robin** (RR), **Weighted Round Robin** (WRR), **Least Connections** (LC), and **Power of Two Choices** (P2C), with metrics calculated in real time, such as average wait time, throughput, and CPU usage.

This tool was made for visually understanding scheduling and balancing in distributed systems, built as a personal project.

[Online Demo](https://alissonvg.github.io/Cluster-Load-Balancing-Simulator/) (hosted via GitHub Pages)

![Demo Image](demo-screenshot.png) 

## Features
- **Real-Time Visualization**: See tasks arriving, queuing, and processing on servers with different speeds.
- **Comparable Algorithms**: Compare LRT, SQ, RR, WRR, LC, and P2C with live switching in Sandbox mode.
- **Modes**:
  - **Sandbox**: Test with sliders for request rate, base service time and algorithm which can be altered in real time.
  - **Benchmark**: Fixed workload and server specs, choose the number of tasks (The options are 50, 100 and 200); runs until completion and generates .csv file (TaskID, WaitTime, Server, etc.).
- **Metrics**: Avg Wait Time (s), Throughput (tasks/min), Avg CPU (%), Cluster Load (%).
- **Customizable Server Specs**: Pick reference server models or tune CPU cores, GHz, RAM, disk IOPS, network bandwidth, and base latency per server.
- **Realistic Workload Mixes**: Simulate Mixed Use, Web/API Heavy, Database Heavy, VM Heavy, and Storage Heavy traffic profiles.
- **Logs and Export**: Automatic CSV export in benchmark for analysis (e.g., in Excel or Python).

## How to Run
### Locally
1. Clone the repository.
2. Open `index.html` in a browser (Tested in Chrome and Firefox).
3. Choose one of the modes: Sandbox for free tests or Benchmark for tests with fixed parameters.

### Online
- Access the [demo](https://alissonvg.github.io/Cluster-Load-Balancing-Simulator/).

No installation required, everything runs in your browser.

## Algorithms Included (so far)
- **Least Remaining Time (LRT)**: Chooses server with lowest expected delay. A basic optimization for heterogeneous clusters.
- **Shortest Queue (SQ)**: Chooses shortest queue, if there's a tie it will choose the fastest server. Simple but less efficient with varying speeds.
- **Round Robin (RR)**: Assigns each request to the next server in rotation. Useful as a simple baseline.
- **Weighted Round Robin (WRR)**: Like RR, but faster servers receive more turns according to their calculated capacity.
- **Least Connections (LC)**: Sends each new task to the server with the fewest active/queued tasks.
- **Power of Two Choices (P2C)**: Randomly samples two servers and chooses the one with the lower expected delay.

## Algorithm References
- **Round Robin, weights, and Least Connections**: NGINX documentation describes Round Robin as the default method, server weights for weighted distribution, and Least Connections as sending requests to the server with the least number of active connections: https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/
- **Least Connections in production load balancers**: NetScaler documentation describes Least Connection as selecting the service with the fewest active connections/transactions: https://docs.netscaler.com/en-us/citrix-adc/current-release/load-balancing/load-balancing-customizing-algorithms/leastconnection-method.html
- **Power of Two Choices**: Azar, Broder, Karlin, and Upfal's "Balanced Allocations" is a foundational reference for the two-choice paradigm: https://research.google/pubs/balanced-allocations/
- **Power of Two Choices in NGINX**: F5/NGINX describes Random with Two Choices as selecting two random servers and choosing the better one, useful especially in distributed load-balancing scenarios: https://www.f5.com/company/blog/nginx/nginx-power-of-two-choices-load-balancing-algorithm

## Technologies
- JavaScript
- HTML5 Canvas for visualization and animations
- CSS3 for UI
- No external dependencies (except Font Awesome for icons)

## Contributions are welcome!
- Fork the repo and send a Pull Request with improvements (new algorithms, server scale-out, richer benchmark metrics).
- Issues welcome for bugs or suggestions.

## License
[MIT License](LICENSE).

Developed by [Alisson Gauer](https://github.com/alissonvg). Inspired by real-world cloud infrastructure experiences and learnings at Dell Technologies.
