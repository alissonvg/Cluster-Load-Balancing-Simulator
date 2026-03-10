document.addEventListener("DOMContentLoaded", () => {
  // Get canvas and context
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Overlays for mode selection and benchmark config
  const modeOverlay = document.getElementById("modeOverlay");
  const benchmarkConfig = document.getElementById("benchmarkConfig");

  // UI Elements for metrics and logs
  const pendingJobsEl = document.getElementById("pendingJobs");
  const completedCountEl = document.getElementById("completedCount");
  const avgWaitEl = document.getElementById("avgWait");
  const cpuAvgEl = document.getElementById("cpuAvg");
  const clusterLoadFill = document.querySelector("#clusterLoad .meter-fill");
  const loadPercentEl = document.getElementById("loadPercent");
  const throughputEl = document.getElementById("throughput");
  const logBody = document.getElementById("logBody");
  const algoNameEl = document.getElementById("algoName");
  const currentAlgoEl = document.getElementById("currentAlgo");
  const benchmarkResultsEl = document.getElementById("benchmarkResults");

  // Parameter controls
  const spawnRange = document.getElementById("spawnRange");
  const procRange = document.getElementById("procRange");
  const spawnValue = document.getElementById("spawnValue");
  const procValue = document.getElementById("procValue");

  // Action buttons
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");

  // Configuration constants
  const GRID_SIZE = 50; // Size of grid cells for background
  let showGrid = true; // Toggle for displaying background grid
  let SPAWN_INTERVAL = 120; // Frames between task arrivals
  let BASE_PROC_TIME = 180; // Base frames to process a task
  const QUEUE_SPACING = 70; // Spacing between queued tasks visually
  const FRAME_MS = 50; // Milliseconds per frame update

  // State variables
  let smartAlgorithm = true; // true: Least Remaining Time, false: Shortest Queue
  let isRunning = false; // Controls if simulation is updating
  let simulatedSeconds = 0; // Total simulated time in seconds
  let spawnCounter = 0; // Counter for next task spawn
  let currentMode = null; // "sandbox" or "benchmark"
  let benchmarkTargetTasks = 0; // Number of tasks for benchmark
  let benchmarkTaskData = []; // Array to store task data for CSV

  // Server definitions (heterogeneous speeds)
  const SERVERS = [
    { x: 0, y: 120, busy: false, progress: 0, queue: [], speed: 1.0, type: "small", name: "small-1" },
    { x: 0, y: 240, busy: false, progress: 0, queue: [], speed: 1.2, type: "medium", name: "medium-1" },
    { x: 0, y: 360, busy: false, progress: 0, queue: [], speed: 1.6, type: "large", name: "large-1" },
    { x: 0, y: 480, busy: false, progress: 0, queue: [], speed: 1.8, type: "xlarge", name: "xlarge-1" }
  ];

  let tasks = []; // Array of active tasks
  let completedTasks = 0; // Count of completed tasks
  let totalWaitMs = 0; // Cumulative wait time in ms

  // Log function with optional color
  function log(msg, color = "#c9d1d9") {
    const div = document.createElement("div");
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    div.style.color = color;
    logBody.appendChild(div);
    if (logBody.children.length > 15) logBody.removeChild(logBody.firstChild);
    logBody.scrollTop = logBody.scrollHeight;
  }

  // Calculate processing time based on server speed
  function getProcessTime(server) {
    return Math.round(BASE_PROC_TIME / server.speed);
  }

  // Get remaining time on current task
  function getRemainingTime(server) {
    return server.busy ? getProcessTime(server) - server.progress : 0;
  }

  // Calculate expected delay for a server
  function getExpectedDelay(server) {
    return getRemainingTime(server) + server.queue.length * getProcessTime(server);
  }

  // Choose best server based on current algorithm
  function chooseBestServer() {
    if (smartAlgorithm) {
      return SERVERS.reduce((best, curr) => getExpectedDelay(curr) < getExpectedDelay(best) ? curr : best);
    } else {
      return SERVERS.reduce((best, curr) => {
        const qDiff = curr.queue.length - best.queue.length;
        if (qDiff < 0) return curr;
        if (qDiff > 0) return best;
        return getProcessTime(curr) < getProcessTime(best) ? curr : best;
      });
    }
  }

  // Update algorithm display in UI
  function updateAlgoDisplay() {
    const name = smartAlgorithm ? "Least Remaining Time" : "Shortest Queue";
    algoNameEl.textContent = name;
    currentAlgoEl.textContent = name;
  }

  // Update all metrics in sidebar
  function updateMetrics() {
    const pending = tasks.filter(t => !t.completed).length;
    pendingJobsEl.textContent = pending;
    completedCountEl.textContent = completedTasks;

    const avgWait = completedTasks > 0 ? (totalWaitMs / completedTasks / 1000).toFixed(2) : "0.00";
    avgWaitEl.textContent = avgWait + " s";

    const throughput = simulatedSeconds > 0 ? (completedTasks / (simulatedSeconds / 60)).toFixed(1) : "0.0";
    throughputEl.textContent = throughput + " tasks/min";

    let totalCpu = 0;
    SERVERS.forEach(s => {
      totalCpu += s.busy ? 100 : 5 + Math.random() * 10;
    });
    const avgCpu = Math.round(totalCpu / SERVERS.length);
    cpuAvgEl.textContent = avgCpu + "%";
    clusterLoadFill.style.width = avgCpu + "%";
    loadPercentEl.textContent = avgCpu + "%";

    // Check if benchmark is complete
    if (currentMode === "benchmark" && completedTasks >= benchmarkTargetTasks) {
      finishBenchmark();
    }
  }

  // Draw rounded rectangle helper
  function roundRect(ctx, x, y, w, h, r, fill = true) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  // Task class
  class Task {
    constructor() {
      this.x = 80;
      this.y = 80 + Math.random() * (canvas.height - 160);
      this.target = null;
      this.processing = false;
      this.completed = false;
      this.alpha = 1;
      this.arrivalTime = performance.now();
      this.pulse = 0;
      this.pulseDir = 1;
      this.type = ["db", "web", "batch"][Math.floor(Math.random() * 3)];
      this.arrivalFrame = Math.round(simulatedSeconds * (1000 / FRAME_MS));
    }

    // Assign task to best server
    assignTarget() {
      this.target = chooseBestServer();
      this.target.queue.push(this);
      log(`Task arrived → assigned to ${this.target.name} (${smartAlgorithm ? "LRT" : "SQ"})`);
    }

    // Update task position and state
    update() {
      if (this.completed) {
        this.x += 12;
        this.alpha -= 0.04;
        return;
      }

      if (!this.target) return;

      const server = this.target;
      const idx = server.queue.indexOf(this);

      this.pulse += (this.processing ? 0.05 : 0.07) * this.pulseDir;
      if (Math.abs(this.pulse) > 3) this.pulseDir *= -1;

      let tx = server.x - idx * QUEUE_SPACING;
      let ty = server.y;
      if (this.processing && idx === 0) {
        tx = server.x;
        ty = server.y;
      }

      const interp = 0.08;
      this.x += (tx - this.x) * interp;
      this.y += (ty - this.y) * interp;

      if (!this.processing && idx === 0 && Math.hypot(tx - this.x, ty - this.y) < 15) {
        this.processing = true;
        server.busy = true;
        server.progress = 0;
        const waitMs = performance.now() - this.arrivalTime;
        totalWaitMs += waitMs;

        // Store data for benchmark CSV
        benchmarkTaskData.push({
          arrival: this.arrivalFrame,
          wait: waitMs.toFixed(0),
          server: server.name
        });

        log(`Task started on ${server.name} (wait: ${waitMs.toFixed(0)} ms)`);
      }
    }

    // Draw task with type-based color and pulse effect
    draw() {
      if (this.alpha <= 0) return;

      const baseSize = this.processing ? 38 : 30;
      const size = baseSize + Math.abs(this.pulse);

      const color = this.type === "db" ? "#8b949e" : this.type === "web" ? "#58a6ff" : "#f9826c";

      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.shadowColor = color + "dd";
      ctx.shadowBlur = this.processing ? 24 : 16;
      ctx.fillStyle = color;
      roundRect(ctx, this.x - size/2, this.y - size/2, size, size, 12, true);
      ctx.restore();
    }
  }

  // Draw server with fans, LED, CPU, progress bar, and queue length
  function drawServer(s) {
    const w = 240, h = 110;
    const x = s.x - w/2, y = s.y - h/2;

    ctx.save();
    ctx.fillStyle = "#161b22";
    roundRect(ctx, x, y, w, h, 12, true);

    const topGrad = ctx.createLinearGradient(x, y, x, y + 50);
    topGrad.addColorStop(0, "#21262d");
    topGrad.addColorStop(1, "#161b22");
    ctx.fillStyle = topGrad;
    roundRect(ctx, x, y, w, 50, 12, true);

    for (let i = 0; i < 3; i++) {
      const cx = x + 50 + i * 60;
      const cy = y + 25;
      ctx.fillStyle = "#0d1117";
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#30363d"; ctx.lineWidth = 2; ctx.stroke();

      if (s.busy) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((Date.now() / 150 + i * 100) % (Math.PI * 2));
        ctx.strokeStyle = "#58a6ff88";
        ctx.lineWidth = 4;
        for (let j = 0; j < 3; j++) {
          ctx.rotate(Math.PI * 2 / 3);
          ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
        }
        ctx.restore();
      }
    }

    ctx.fillStyle = "#0d1117";
    roundRect(ctx, x + 20, y + 60, w - 40, 30, 6, true);

    const ledColor = s.busy ? "#f98026" : "#3fb950";
    ctx.shadowColor = ledColor;
    ctx.shadowBlur = s.busy ? 35 : 20;
    ctx.fillStyle = ledColor;
    ctx.beginPath(); ctx.arc(x + w - 30, y + 25, 9, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#c9d1d9";
    ctx.font = "bold 15px Inter";
    ctx.fillText(s.type.toUpperCase(), x + 20, y + 28);

    const cpu = s.busy ? 100 : Math.round(5 + Math.random() * 10);
    ctx.fillStyle = "#8b949e";
    ctx.font = "13px Inter";
    ctx.fillText(`CPU: ${cpu}%`, x + 20, y + 48);

    if (s.busy) {
      const bw = w - 40;
      const pt = getProcessTime(s);
      ctx.fillStyle = "#30363d";
      roundRect(ctx, x + 20, y + h - 18, bw, 10, 5, true);

      ctx.fillStyle = "#58a6ff";
      roundRect(ctx, x + 20, y + h - 18, bw * (s.progress / pt), 10, 5, true);
    }

    ctx.fillStyle = "#c9d1d9";
    ctx.font = "12px Inter";
    ctx.fillText(`Queue: ${s.queue.length}`, x + 20, y + h - 25);

    ctx.restore();
  }

  // Adjust canvas to fit window
  function fitCanvas() {
    const container = canvas.parentElement;
    const headerH = 56;
    const availH = window.innerHeight - headerH;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = container.clientWidth * dpr;
    canvas.height = availH * dpr;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = availH + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    SERVERS.forEach(s => s.x = canvas.width * 0.75);
  }

  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  // Core update loop for simulation logic
  function update() {
    if (!isRunning) return;

    simulatedSeconds += FRAME_MS / 1000;

    spawnCounter++;
    if (spawnCounter >= SPAWN_INTERVAL) {
      const task = new Task();
      tasks.push(task);
      task.assignTarget();
      spawnCounter = 0;
    }

    tasks.forEach(t => t.update());

    SERVERS.forEach(s => {
      if (s.busy) {
        s.progress++;
        if (s.progress >= getProcessTime(s)) {
          const finished = s.queue.shift();
          if (finished) {
            finished.completed = true;
            completedTasks++;
            log(`Task completed on ${s.type}`);
          }
          s.busy = false;
          s.progress = 0;
        }
      }
    });

    updateMetrics();
  }

  // Draw everything on canvas
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    SERVERS.forEach(drawServer);
    tasks.forEach(t => t.draw());

    tasks = tasks.filter(t => t.alpha > 0);
  }

  // Main animation loop
  function animationLoop() {
    update();
    draw();
    requestAnimationFrame(animationLoop);
  }
  animationLoop();

  // Button controls
  pauseBtn.onclick = () => {
    isRunning = !isRunning;
    pauseBtn.innerHTML = isRunning ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Resume';
    log(isRunning ? "Simulation resumed" : "Simulation paused");
  };

  resetBtn.onclick = () => {
    tasks = [];
    SERVERS.forEach(s => { s.queue = []; s.busy = false; s.progress = 0; });
    completedTasks = 0;
    totalWaitMs = 0;
    simulatedSeconds = 0;
    spawnCounter = 0;
    benchmarkTaskData = [];
    benchmarkResultsEl.innerHTML = "";
    updateMetrics();
    log("Simulation reset");
  };

  exportBtn.onclick = () => {
    if (benchmarkTaskData.length === 0) {
      log("No data to export");
      return;
    }
    const csv = generateBenchmarkCSV();
    const today = new Date().toISOString().slice(0, 10);
    const algo = smartAlgorithm ? "LRT" : "SQ";
    const filename = `benchmark_${completedTasks}_tasks_${algo}_${today}.csv`;
    downloadCSV(csv, filename);
    log(`Results exported: ${filename}`);
  };

  // Mode selection handlers
  document.getElementById("sandboxBtn").onclick = () => {
    currentMode = "sandbox";
    modeOverlay.style.display = "none";
    isRunning = true;
    log("Sandbox Mode started – adjust arrival/processing in sliders", "#58a6ff");
  };

  document.getElementById("benchmarkBtn").onclick = () => {
    modeOverlay.style.display = "none";
    benchmarkConfig.style.display = "flex";
  };

  document.getElementById("startBenchmarkBtn").onclick = () => {
    benchmarkConfig.style.display = "none";
    currentMode = "benchmark";
    benchmarkTargetTasks = parseInt(document.getElementById("numTasksSelect").value);
    smartAlgorithm = document.getElementById("benchmarkAlgoSelect").value === "true";

    // Lock controls for fixed params
    spawnRange.disabled = procRange.disabled = true;

    // Reset and start
    tasks = [];
    SERVERS.forEach(s => { s.queue = []; s.busy = false; s.progress = 0; });
    completedTasks = 0;
    totalWaitMs = 0;
    simulatedSeconds = 0;
    spawnCounter = 0;
    benchmarkTaskData = [];

    isRunning = true;
    log(`Benchmark started: ${benchmarkTargetTasks} tasks (${smartAlgorithm ? "LRT" : "SQ"})`, "#f9826c");
  };

  // Parameter sliders (active only in sandbox)
  spawnRange.oninput = () => {
    if (currentMode !== "sandbox") return;
    SPAWN_INTERVAL = parseInt(spawnRange.value);
    spawnValue.textContent = SPAWN_INTERVAL;
  };

  procRange.oninput = () => {
    if (currentMode !== "sandbox") return;
    BASE_PROC_TIME = parseInt(procRange.value);
    procValue.textContent = BASE_PROC_TIME;
  };

  // Finish benchmark and auto-export CSV
  function finishBenchmark() {
    isRunning = false;

    const today = new Date().toISOString().slice(0, 10);
    const algo = smartAlgorithm ? "LRT" : "SQ";
    const filename = `benchmark_${benchmarkTargetTasks}_tasks_${algo}_${today}.csv`;

    const csv = generateBenchmarkCSV();
    downloadCSV(csv, filename);

    const avgWait = (totalWaitMs / completedTasks / 1000).toFixed(2);
    benchmarkResultsEl.innerHTML = `
      <strong style="color:#3fb950">Benchmark completed!</strong><br>
      Tasks: ${completedTasks}<br>
      Avg Wait: ${avgWait} s<br>
      File generated: ${filename}
    `;

    log(`Benchmark finished – CSV generated: ${filename}`, "#3fb950");
  }

  // Generate CSV content
  function generateBenchmarkCSV() {
    let csv = "TaskID,Algorithm,ArrivalFrame,WaitTime_ms,Server\n";
    benchmarkTaskData.forEach((t, i) => {
      csv += `${i+1},${smartAlgorithm ? "LRT" : "SQ"},${t.arrival},${t.wait},${t.server}\n`;
    });
    return csv;
  }

  // Download CSV file
  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // Initial setup
  fitCanvas();
  animationLoop();
  modeOverlay.style.display = "flex";
});