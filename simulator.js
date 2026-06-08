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
  // Sidebar algorithm selector (sandbox-only)
  const algoSelect = document.getElementById("algoSelect");
  const workloadSelect = document.getElementById("workloadSelect");
  // Benchmark-specific parameter controls (modal)
  const benchSpawnRange = document.getElementById("benchSpawnRange");
  const benchProcRange = document.getElementById("benchProcRange");
  const benchSpawnValue = document.getElementById("benchSpawnValue");
  const benchProcValue = document.getElementById("benchProcValue");
  const benchmarkWorkloadSelect = document.getElementById("benchmarkWorkloadSelect");
  const benchServerSelect = document.getElementById("benchServerSelect");
  const benchServerPresetSelect = document.getElementById("benchServerPresetSelect");
  const benchSpecCpuCores = document.getElementById("benchSpecCpuCores");
  const benchSpecCpuGhz = document.getElementById("benchSpecCpuGhz");
  const benchSpecRamGb = document.getElementById("benchSpecRamGb");
  const benchSpecDiskIops = document.getElementById("benchSpecDiskIops");
  const benchSpecNetworkMbps = document.getElementById("benchSpecNetworkMbps");
  const benchSpecLatencyMs = document.getElementById("benchSpecLatencyMs");
  const serverSelect = document.getElementById("serverSelect");
  const serverPresetSelect = document.getElementById("serverPresetSelect");
  const specCpuCores = document.getElementById("specCpuCores");
  const specCpuGhz = document.getElementById("specCpuGhz");
  const specRamGb = document.getElementById("specRamGb");
  const specDiskIops = document.getElementById("specDiskIops");
  const specNetworkMbps = document.getElementById("specNetworkMbps");
  const specLatencyMs = document.getElementById("specLatencyMs");

  // Action buttons
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const benchmarkResetBtn = document.getElementById("benchmarkResetBtn");
  const benchmarkExportBtn = document.getElementById("benchmarkExportBtn");
  const applyServerSpecsBtn = document.getElementById("applyServerSpecsBtn");
  const applyBenchServerSpecsBtn = document.getElementById("applyBenchServerSpecsBtn");
  const toggleGridBtn = document.getElementById("toggleGrid");

  // Configuration constants
  const GRID_SIZE = 50; // Size of grid cells for background
  let showGrid = true; // Toggle for displaying background grid
  let REQUEST_RATE_PER_MIN = 30; // Incoming workload intensity
  let BASE_SERVICE_TIME_MS = 900; // Baseline service time before server/task modifiers
  const QUEUE_SPACING = 70; // Spacing between queued tasks visually
  const FRAME_MS = 50; // Milliseconds per frame update

  // State variables
  let currentAlgorithm = "lrt";
  let roundRobinIndex = 0;
  let weightedRoundRobinSequence = [];
  let weightedRoundRobinIndex = 0;
  let isRunning = false; // Controls if simulation is updating
  let simulatedSeconds = 0; // Total simulated time in seconds
  let spawnCounter = 0; // Counter for next task spawn
  let currentMode = null; // "sandbox" or "benchmark"
  let benchmarkTargetTasks = 0; // Number of tasks for benchmark
  let benchmarkTaskData = []; // Array to store task data for CSV
  let currentWorkloadMix = "mixed";

  const SERVER_PRESETS = {
    small: {
      label: "Small general",
      type: "small",
      cpuCores: 2,
      cpuGhz: 2.4,
      ramGb: 4,
      diskIops: 1200,
      networkMbps: 250,
      baseLatencyMs: 8
    },
    medium: {
      label: "Medium general",
      type: "medium",
      cpuCores: 4,
      cpuGhz: 2.8,
      ramGb: 16,
      diskIops: 3500,
      networkMbps: 1000,
      baseLatencyMs: 6
    },
    compute: {
      label: "Compute optimized",
      type: "compute",
      cpuCores: 8,
      cpuGhz: 3.5,
      ramGb: 16,
      diskIops: 4500,
      networkMbps: 2000,
      baseLatencyMs: 5
    },
    memory: {
      label: "Memory optimized",
      type: "memory",
      cpuCores: 6,
      cpuGhz: 3.0,
      ramGb: 64,
      diskIops: 4000,
      networkMbps: 1500,
      baseLatencyMs: 6
    },
    io: {
      label: "I/O optimized",
      type: "io",
      cpuCores: 6,
      cpuGhz: 3.0,
      ramGb: 32,
      diskIops: 15000,
      networkMbps: 5000,
      baseLatencyMs: 4
    }
  };

  const TASK_PROFILES = {
    webApi: {
      label: "Web/API",
      cpu: 32,
      ramMb: 192,
      diskIo: 90,
      networkMb: 6,
      durationMultiplier: 0.7,
      variability: 0.28,
      color: "#58a6ff"
    },
    database: {
      label: "Database",
      cpu: 70,
      ramMb: 2048,
      diskIo: 1800,
      networkMb: 8,
      durationMultiplier: 1.35,
      variability: 0.45,
      color: "#a371f7"
    },
    virtualMachine: {
      label: "Virtual Machine",
      cpu: 135,
      ramMb: 4096,
      diskIo: 350,
      networkMb: 4,
      durationMultiplier: 2.15,
      variability: 0.35,
      color: "#f9826c"
    },
    storage: {
      label: "Storage Transfer",
      cpu: 28,
      ramMb: 512,
      diskIo: 1200,
      networkMb: 96,
      durationMultiplier: 1.55,
      variability: 0.5,
      color: "#3fb950"
    }
  };

  const WORKLOAD_MIXES = {
    mixed: {
      label: "Mixed Use",
      weights: { webApi: 40, database: 25, virtualMachine: 20, storage: 15 }
    },
    webHeavy: {
      label: "Web/API Heavy",
      weights: { webApi: 70, database: 15, virtualMachine: 10, storage: 5 }
    },
    databaseHeavy: {
      label: "Database Heavy",
      weights: { webApi: 20, database: 60, virtualMachine: 10, storage: 10 }
    },
    vmHeavy: {
      label: "VM Heavy",
      weights: { webApi: 15, database: 15, virtualMachine: 60, storage: 10 }
    },
    storageHeavy: {
      label: "Storage Heavy",
      weights: { webApi: 15, database: 15, virtualMachine: 10, storage: 60 }
    }
  };

  const ALGORITHMS = {
    lrt: {
      label: "Least Remaining Time",
      shortLabel: "LRT"
    },
    sq: {
      label: "Shortest Queue",
      shortLabel: "SQ"
    },
    rr: {
      label: "Round Robin",
      shortLabel: "RR"
    },
    wrr: {
      label: "Weighted Round Robin",
      shortLabel: "WRR"
    },
    lc: {
      label: "Least Connections",
      shortLabel: "LC"
    },
    p2c: {
      label: "Power of Two Choices",
      shortLabel: "P2C"
    }
  };

  // Server definitions (heterogeneous, spec-driven capacity)
  const SERVERS = [
    createServer("Server 01", 120, "small"),
    createServer("Server 02", 240, "medium"),
    createServer("Server 03", 360, "compute"),
    createServer("Server 04", 480, "memory")
  ];
  rebuildWeightedRoundRobinSequence();

  let tasks = []; // Array of active tasks
  let completedTasks = 0; // Count of completed tasks
  let totalWaitMs = 0; // Cumulative wait time in ms

  function clonePreset(presetKey) {
    return { ...SERVER_PRESETS[presetKey] };
  }

  function calculateServerSpeed(specs) {
    const cpuScore = (specs.cpuCores * specs.cpuGhz) / (2 * 2.4);
    const ramScore = Math.sqrt(specs.ramGb / 4);
    const diskScore = Math.sqrt(specs.diskIops / 1200);
    const networkScore = Math.sqrt(specs.networkMbps / 250);
    const latencyPenalty = 1 + specs.baseLatencyMs / 100;

    return Math.max(
      0.35,
      (cpuScore * 0.55 + ramScore * 0.15 + diskScore * 0.18 + networkScore * 0.12) / latencyPenalty
    );
  }

  function createServer(name, y, presetKey) {
    const specs = clonePreset(presetKey);
    return {
      x: 0,
      y,
      busy: false,
      progress: 0,
      queue: [],
      presetKey,
      specs,
      speed: calculateServerSpeed(specs),
      type: specs.type,
      name
    };
  }

  function updateServerCapacity(server) {
    server.speed = calculateServerSpeed(server.specs);
    server.type = server.specs.type || "custom";
    rebuildWeightedRoundRobinSequence();
  }

  function getServerWeight(server) {
    return Math.max(1, Math.round(server.speed));
  }

  function rebuildWeightedRoundRobinSequence() {
    if (typeof SERVERS === "undefined") return;
    weightedRoundRobinSequence = [];
    SERVERS.forEach((server, index) => {
      const weight = getServerWeight(server);
      for (let i = 0; i < weight; i++) {
        weightedRoundRobinSequence.push(index);
      }
    });
    if (weightedRoundRobinSequence.length === 0) {
      weightedRoundRobinSequence = SERVERS.map((_, index) => index);
    }
    weightedRoundRobinIndex = weightedRoundRobinIndex % weightedRoundRobinSequence.length;
  }

  function getServerCpu(server) {
    if (!server.busy) return Math.round(4 + server.queue.length * 3);

    const activeTask = server.queue[0];
    const cpuCapacity = server.specs.cpuCores * server.specs.cpuGhz * 22;
    const activeDemand = activeTask ? activeTask.profile.cpu : 0;
    const queuePressure = Math.max(0, server.queue.length - 1) * 5;
    return Math.min(100, Math.round(8 + (activeDemand / cpuCapacity) * 100 + queuePressure));
  }

  function resetSimulationState() {
    tasks = [];
    SERVERS.forEach(s => { s.queue = []; s.busy = false; s.progress = 0; });
    completedTasks = 0;
    totalWaitMs = 0;
    simulatedSeconds = 0;
    spawnCounter = 0;
    roundRobinIndex = 0;
    weightedRoundRobinIndex = 0;
    benchmarkTaskData = [];
    benchmarkResultsEl.innerHTML = "";
    updateMetrics();
  }

  function setControlsDisabled(elements, disabled) {
    elements.filter(Boolean).forEach(el => {
      el.disabled = disabled;
    });
  }

  function setBenchmarkLocked(locked) {
    setControlsDisabled([
      spawnRange,
      procRange,
      algoSelect,
      serverSelect,
      serverPresetSelect,
      specCpuCores,
      specCpuGhz,
      specRamGb,
      specDiskIops,
      specNetworkMbps,
      specLatencyMs,
      applyServerSpecsBtn,
      workloadSelect,
      benchSpawnRange,
      benchProcRange,
      benchmarkWorkloadSelect,
      benchServerSelect,
      benchServerPresetSelect,
      benchSpecCpuCores,
      benchSpecCpuGhz,
      benchSpecRamGb,
      benchSpecDiskIops,
      benchSpecNetworkMbps,
      benchSpecLatencyMs,
      applyBenchServerSpecsBtn,
      document.getElementById("numTasksSelect"),
      document.getElementById("benchmarkAlgoSelect")
    ], locked);
  }

  function setBenchmarkSidebar(active) {
    document.querySelectorAll(".sandbox-sidebar").forEach(el => {
      el.hidden = active;
    });
    document.querySelectorAll(".benchmark-sidebar").forEach(el => {
      el.hidden = !active;
    });
  }

  // Log function with optional color
  function log(msg, color = "#c9d1d9") {
    const div = document.createElement("div");
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    div.style.color = color;
    logBody.appendChild(div);
    if (logBody.children.length > 15) logBody.removeChild(logBody.firstChild);
    logBody.scrollTop = logBody.scrollHeight;
  }

  function getSpawnIntervalFrames() {
    const framesPerMinute = 60000 / FRAME_MS;
    return Math.max(1, Math.round(framesPerMinute / REQUEST_RATE_PER_MIN));
  }

  function getBaseServiceFrames() {
    return Math.max(1, Math.round(BASE_SERVICE_TIME_MS / FRAME_MS));
  }

  function formatRequestRate(value) {
    return `${value} req/min`;
  }

  function formatServiceTime(value) {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${value} ms`;
  }

  function updateWorkloadControlLabels() {
    spawnValue.textContent = formatRequestRate(REQUEST_RATE_PER_MIN);
    procValue.textContent = formatServiceTime(BASE_SERVICE_TIME_MS);
    if (benchSpawnValue) benchSpawnValue.textContent = formatRequestRate(parseInt(benchSpawnRange.value, 10));
    if (benchProcValue) benchProcValue.textContent = formatServiceTime(parseInt(benchProcRange.value, 10));
  }

  function pickTaskType() {
    const mix = WORKLOAD_MIXES[currentWorkloadMix] || WORKLOAD_MIXES.mixed;
    const entries = Object.entries(mix.weights);
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const [type, weight] of entries) {
      cursor -= weight;
      if (cursor <= 0) return type;
    }

    return entries[0][0];
  }

  function getTaskDurationMultiplier(task) {
    if (!task) return TASK_PROFILES.webApi.durationMultiplier;
    return task.durationMultiplier || task.profile.durationMultiplier;
  }

  // Calculate processing time based on server capacity and task resource profile
  function getProcessTime(server, task = server.queue[0]) {
    const profile = task?.profile || TASK_PROFILES.webApi;
    const cpuFit = profile.cpu / (server.specs.cpuCores * server.specs.cpuGhz * 22);
    const ramFit = profile.ramMb / (server.specs.ramGb * 1024);
    const diskFit = profile.diskIo / server.specs.diskIops;
    const networkFit = profile.networkMb / Math.max(1, server.specs.networkMbps / 8);
    const saturationPenalty = 1 + Math.max(cpuFit, ramFit, diskFit, networkFit) * 0.85;
    const latencyFrames = server.specs.baseLatencyMs / FRAME_MS;

    return Math.max(
      8,
      Math.round((getBaseServiceFrames() * getTaskDurationMultiplier(task) * saturationPenalty) / server.speed + latencyFrames)
    );
  }

  // Get remaining time on current task
  function getRemainingTime(server) {
    return server.busy ? getProcessTime(server, server.queue[0]) - server.progress : 0;
  }

  // Calculate expected delay for a server
  function getExpectedDelay(server) {
    return server.queue.reduce((delay, task, idx) => {
      if (idx === 0 && server.busy) {
        return delay + getRemainingTime(server);
      }
      return delay + getProcessTime(server, task);
    }, 0);
  }

  // Choose best server based on current algorithm
  function chooseBestServer() {
    switch (currentAlgorithm) {
      case "sq":
        return SERVERS.reduce((best, curr) => {
          const qDiff = curr.queue.length - best.queue.length;
          if (qDiff < 0) return curr;
          if (qDiff > 0) return best;
          return getProcessTime(curr) < getProcessTime(best) ? curr : best;
        });
      case "rr": {
        const server = SERVERS[roundRobinIndex % SERVERS.length];
        roundRobinIndex = (roundRobinIndex + 1) % SERVERS.length;
        return server;
      }
      case "wrr": {
        const serverIndex = weightedRoundRobinSequence[weightedRoundRobinIndex % weightedRoundRobinSequence.length];
        weightedRoundRobinIndex = (weightedRoundRobinIndex + 1) % weightedRoundRobinSequence.length;
        return SERVERS[serverIndex];
      }
      case "lc":
        return SERVERS.reduce((best, curr) => {
          const activeDiff = curr.queue.length - best.queue.length;
          if (activeDiff < 0) return curr;
          if (activeDiff > 0) return best;
          return getExpectedDelay(curr) < getExpectedDelay(best) ? curr : best;
        });
      case "p2c": {
        const firstIndex = Math.floor(Math.random() * SERVERS.length);
        let secondIndex = Math.floor(Math.random() * SERVERS.length);
        if (SERVERS.length > 1) {
          while (secondIndex === firstIndex) {
            secondIndex = Math.floor(Math.random() * SERVERS.length);
          }
        }
        const first = SERVERS[firstIndex];
        const second = SERVERS[secondIndex];
        return getExpectedDelay(first) <= getExpectedDelay(second) ? first : second;
      }
      case "lrt":
      default:
        return SERVERS.reduce((best, curr) => getExpectedDelay(curr) < getExpectedDelay(best) ? curr : best);
    }
  }

  function getAlgorithmShortLabel() {
    return ALGORITHMS[currentAlgorithm]?.shortLabel || currentAlgorithm.toUpperCase();
  }

  function getAlgorithmLabel() {
    return ALGORITHMS[currentAlgorithm]?.label || currentAlgorithm;
  }

  function getAlgorithmExportLabel() {
    return getAlgorithmShortLabel();
  }

  function syncAlgorithmControls() {
    if (algoSelect) algoSelect.value = currentAlgorithm;
    const benchmarkAlgoSelect = document.getElementById("benchmarkAlgoSelect");
    if (benchmarkAlgoSelect) benchmarkAlgoSelect.value = currentAlgorithm;
  }

  function legacyAlgorithmValueToKey(value) {
    if (value === "true") return "lrt";
    if (value === "false") return "sq";
    return value;
  }

  // Update algorithm display in UI
  function updateAlgoDisplay() {
    const name = getAlgorithmLabel();
    if (algoNameEl) algoNameEl.textContent = name;
    if (currentAlgoEl) currentAlgoEl.textContent = name;
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
      totalCpu += getServerCpu(s);
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
      this.type = pickTaskType();
      this.profile = TASK_PROFILES[this.type];
      const variance = (Math.random() * 2 - 1) * this.profile.variability;
      this.durationMultiplier = Math.max(0.35, this.profile.durationMultiplier * (1 + variance));
      this.arrivalFrame = Math.round(simulatedSeconds * (1000 / FRAME_MS));
    }

    // Assign task to best server
    assignTarget() {
      this.target = chooseBestServer();
      this.target.queue.push(this);
      log(`Task arrived → assigned to ${this.target.name} (${getAlgorithmShortLabel()})`);
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
          requestRate: REQUEST_RATE_PER_MIN,
          baseServiceTime: BASE_SERVICE_TIME_MS,
          server: server.name,
          serverModel: server.specs.label,
          taskType: this.profile.label,
          workloadMix: WORKLOAD_MIXES[currentWorkloadMix].label
        });

        log(`${this.profile.label} task started on ${server.name} (wait: ${waitMs.toFixed(0)} ms)`);
      }
    }

    // Draw task with type-based color and pulse effect
    draw() {
      if (this.alpha <= 0) return;

      const baseSize = this.processing ? 38 : 30;
      const size = baseSize + Math.abs(this.pulse);

      const color = this.profile.color;

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
    const w = 260, h = 124;
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
    ctx.fillText(s.name, x + 20, y + 28);

    const cpu = getServerCpu(s);
    ctx.fillStyle = "#8b949e";
    ctx.font = "12px Inter";
    ctx.fillText(`${s.specs.cpuCores}c @ ${s.specs.cpuGhz}GHz  RAM ${s.specs.ramGb}GB`, x + 20, y + 48);
    ctx.fillText(`CPU: ${cpu}%  Net: ${s.specs.networkMbps}Mbps`, x + 20, y + 66);

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
    ctx.fillText(`Queue: ${s.queue.length}  Model: ${s.specs.label}`, x + 20, y + h - 26);

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

    // Dynamic server positioning based on current sidebar width
    const sidebarW = document.querySelector('.sidebar').offsetWidth || 280;
    document.documentElement.style.setProperty('--sidebar-width', sidebarW + 'px');
    SERVERS.forEach(s => s.x = container.clientWidth - (sidebarW + 40)); // keeps servers nicely aligned on any screen size
  }

  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  // Core update loop for simulation logic
  function update() {
    if (!isRunning) return;

    simulatedSeconds += FRAME_MS / 1000;

    spawnCounter++;
    if (spawnCounter >= getSpawnIntervalFrames()) {
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

  function resetSimulation() {
    resetSimulationState();
    setBenchmarkLocked(false);
    setBenchmarkSidebar(false);
    log("Simulation reset");
    // Re-enable sidebar sliders in case they were locked by benchmark
    syncAlgorithmControls();
  }

  resetBtn.onclick = resetSimulation;
  if (benchmarkResetBtn) benchmarkResetBtn.onclick = resetSimulation;

  if (toggleGridBtn) {
    toggleGridBtn.onclick = () => {
      showGrid = !showGrid;
      log(showGrid ? "Grid enabled" : "Grid disabled");
    };
  }

  function exportBenchmarkData() {
    if (benchmarkTaskData.length === 0) {
      log("No data to export");
      return;
    }
    const csv = generateBenchmarkCSV();
    const today = new Date().toISOString().slice(0, 10);
    const algo = getAlgorithmExportLabel();
    const filename = `benchmark_${completedTasks}_tasks_${algo}_${today}.csv`;
    downloadCSV(csv, filename);
    log(`Results exported: ${filename}`);
  }

  exportBtn.onclick = exportBenchmarkData;
  if (benchmarkExportBtn) benchmarkExportBtn.onclick = exportBenchmarkData;

  // Mode selection handlers
  document.getElementById("sandboxBtn").onclick = () => {
    currentMode = "sandbox";
    modeOverlay.style.display = "none";
    isRunning = true;
    setBenchmarkLocked(false);
    setBenchmarkSidebar(false);
    syncAlgorithmControls();
    updateAlgoDisplay();
    fitCanvas(); // Force redraw after overlay hide
    log("Sandbox Mode started – adjust request rate and service time", "#58a6ff");
  };

  document.getElementById("benchmarkBtn").onclick = () => {
    // Populate benchmark modal from current live parameters
    if (benchSpawnRange) {
      benchSpawnRange.value = REQUEST_RATE_PER_MIN;
    }
    if (benchProcRange) {
      benchProcRange.value = BASE_SERVICE_TIME_MS;
    }
    updateWorkloadControlLabels();
    if (benchmarkWorkloadSelect) {
      benchmarkWorkloadSelect.value = currentWorkloadMix;
    }
    syncAlgorithmControls();
    if (benchServerSelect && benchServerPresetSelect) {
      benchServerSelect.value = "0";
      populateSpecForm(SERVERS[0], benchmarkSpecControls);
    }

    modeOverlay.style.display = "none";
    benchmarkConfig.style.display = "flex";
    fitCanvas(); // Force redraw
  };

  document.getElementById("startBenchmarkBtn").onclick = () => {
    applyBenchmarkServerSpecs(false);
    benchmarkConfig.style.display = "none";
    currentMode = "benchmark";
    benchmarkTargetTasks = parseInt(document.getElementById("numTasksSelect").value);
    currentAlgorithm = legacyAlgorithmValueToKey(document.getElementById("benchmarkAlgoSelect").value);
    currentWorkloadMix = benchmarkWorkloadSelect.value;

    // Apply chosen benchmark parameters (arrival / processing) and lock controls
    if (benchSpawnRange) {
      REQUEST_RATE_PER_MIN = parseInt(benchSpawnRange.value, 10);
    }
    if (benchProcRange) {
      BASE_SERVICE_TIME_MS = parseInt(benchProcRange.value, 10);
    }
    spawnRange.value = REQUEST_RATE_PER_MIN;
    procRange.value = BASE_SERVICE_TIME_MS;
    updateWorkloadControlLabels();
    setBenchmarkLocked(true);
    setBenchmarkSidebar(true);
    syncAlgorithmControls();
    if (workloadSelect) workloadSelect.value = currentWorkloadMix;

    // Reset and start
    resetSimulationState();

    isRunning = true;
    fitCanvas(); // Force redraw
    updateAlgoDisplay();
    log(`Benchmark started: ${benchmarkTargetTasks} tasks, ${WORKLOAD_MIXES[currentWorkloadMix].label}, ${formatRequestRate(REQUEST_RATE_PER_MIN)}, base ${formatServiceTime(BASE_SERVICE_TIME_MS)} (${getAlgorithmShortLabel()})`, "#f9826c");
  };

  // Parameter sliders (active only in sandbox)
  spawnRange.oninput = () => {
    if (currentMode !== "sandbox") return;
    REQUEST_RATE_PER_MIN = parseInt(spawnRange.value, 10);
    updateWorkloadControlLabels();
  };

  procRange.oninput = () => {
    if (currentMode !== "sandbox") return;
    BASE_SERVICE_TIME_MS = parseInt(procRange.value, 10);
    updateWorkloadControlLabels();
  };

  // Benchmark modal slider updates
  if (benchSpawnRange) {
    benchSpawnRange.oninput = () => {
      benchSpawnValue.textContent = formatRequestRate(parseInt(benchSpawnRange.value, 10));
    };
  }

  if (benchProcRange) {
    benchProcRange.oninput = () => {
      benchProcValue.textContent = formatServiceTime(parseInt(benchProcRange.value, 10));
    };
  }

  // Sidebar algorithm selector behavior
  if (algoSelect) {
    // initialize
    algoSelect.value = currentAlgorithm;
    algoSelect.disabled = false;
    algoSelect.onchange = () => {
      if (currentMode !== "sandbox") {
        algoSelect.value = currentAlgorithm;
        log("Algorithm can only be changed in Sandbox mode", "#f9826c");
        return;
      }
      currentAlgorithm = legacyAlgorithmValueToKey(algoSelect.value);
      syncAlgorithmControls();
      updateAlgoDisplay();
      log(`Algorithm set to ${getAlgorithmLabel()} (${getAlgorithmShortLabel()})`, "#58a6ff");
    };
  }

  if (workloadSelect) {
    workloadSelect.value = currentWorkloadMix;
    workloadSelect.onchange = () => {
      if (currentMode !== "sandbox") {
        workloadSelect.value = currentWorkloadMix;
        log("Workload mix can only be changed in Sandbox mode", "#f9826c");
        return;
      }

      currentWorkloadMix = workloadSelect.value;
      log(`Workload mix set to ${WORKLOAD_MIXES[currentWorkloadMix].label}`, "#58a6ff");
    };
  }

  const sidebarSpecControls = {
    serverSelect,
    presetSelect: serverPresetSelect,
    cpuCores: specCpuCores,
    cpuGhz: specCpuGhz,
    ramGb: specRamGb,
    diskIops: specDiskIops,
    networkMbps: specNetworkMbps,
    latencyMs: specLatencyMs
  };

  const benchmarkSpecControls = {
    serverSelect: benchServerSelect,
    presetSelect: benchServerPresetSelect,
    cpuCores: benchSpecCpuCores,
    cpuGhz: benchSpecCpuGhz,
    ramGb: benchSpecRamGb,
    diskIops: benchSpecDiskIops,
    networkMbps: benchSpecNetworkMbps,
    latencyMs: benchSpecLatencyMs
  };

  function selectedServer(controls = sidebarSpecControls) {
    return SERVERS[parseInt(controls.serverSelect.value, 10)] || SERVERS[0];
  }

  function populateSpecForm(server, controls = sidebarSpecControls) {
    const specs = server.specs;
    controls.presetSelect.value = server.presetKey || "custom";
    controls.cpuCores.value = specs.cpuCores;
    controls.cpuGhz.value = specs.cpuGhz;
    controls.ramGb.value = specs.ramGb;
    controls.diskIops.value = specs.diskIops;
    controls.networkMbps.value = specs.networkMbps;
    controls.latencyMs.value = specs.baseLatencyMs;
  }

  function populateServerSpecForm(server) {
    populateSpecForm(server, sidebarSpecControls);
  }

  function applyPresetToSpecForm(controls) {
    const preset = SERVER_PRESETS[controls.presetSelect.value];
    if (!preset) return;
    controls.cpuCores.value = preset.cpuCores;
    controls.cpuGhz.value = preset.cpuGhz;
    controls.ramGb.value = preset.ramGb;
    controls.diskIops.value = preset.diskIops;
    controls.networkMbps.value = preset.networkMbps;
    controls.latencyMs.value = preset.baseLatencyMs;
  }

  function readSpecForm(controls = sidebarSpecControls) {
    const presetKey = controls.presetSelect.value;
    const preset = SERVER_PRESETS[presetKey];

    return {
      label: preset ? preset.label : "Custom specs",
      type: preset ? preset.type : "custom",
      cpuCores: Math.max(1, parseInt(controls.cpuCores.value, 10) || 1),
      cpuGhz: Math.max(0.5, parseFloat(controls.cpuGhz.value) || 0.5),
      ramGb: Math.max(1, parseInt(controls.ramGb.value, 10) || 1),
      diskIops: Math.max(100, parseInt(controls.diskIops.value, 10) || 100),
      networkMbps: Math.max(10, parseInt(controls.networkMbps.value, 10) || 10),
      baseLatencyMs: Math.max(0, parseInt(controls.latencyMs.value, 10) || 0)
    };
  }

  function applySpecsFromForm(controls = sidebarSpecControls) {
    const server = selectedServer(controls);
    server.specs = readSpecForm(controls);
    server.presetKey = controls.presetSelect.value;
    updateServerCapacity(server);
    return server;
  }

  function applyBenchmarkServerSpecs(shouldLog = true) {
    if (!benchServerSelect || !benchServerPresetSelect) return null;
    const server = applySpecsFromForm(benchmarkSpecControls);
    sidebarSpecControls.serverSelect.value = benchmarkSpecControls.serverSelect.value;
    populateSpecForm(server, sidebarSpecControls);
    if (shouldLog) {
      log(`${server.name} benchmark specs set (${server.specs.label}, speed x${server.speed.toFixed(2)})`, "#3fb950");
    }
    return server;
  }

  if (serverSelect && serverPresetSelect) {
    serverSelect.onchange = () => populateServerSpecForm(selectedServer(sidebarSpecControls));

    serverPresetSelect.onchange = () => {
      applyPresetToSpecForm(sidebarSpecControls);
    };

    [specCpuCores, specCpuGhz, specRamGb, specDiskIops, specNetworkMbps, specLatencyMs].forEach(input => {
      input.oninput = () => {
        serverPresetSelect.value = "custom";
      };
    });

    applyServerSpecsBtn.onclick = () => {
      if (currentMode === "benchmark" && isRunning) {
        populateServerSpecForm(selectedServer());
        log("Server specs can be changed after the benchmark finishes", "#f9826c");
        return;
      }

      const server = applySpecsFromForm(sidebarSpecControls);
      resetSimulationState();
      fitCanvas();
      log(`${server.name} specs applied (${server.specs.label}, speed x${server.speed.toFixed(2)})`, "#3fb950");
    };

    populateServerSpecForm(SERVERS[0]);
  }

  if (benchServerSelect && benchServerPresetSelect) {
    benchServerSelect.onchange = () => populateSpecForm(selectedServer(benchmarkSpecControls), benchmarkSpecControls);

    benchServerPresetSelect.onchange = () => {
      applyPresetToSpecForm(benchmarkSpecControls);
    };

    [
      benchSpecCpuCores,
      benchSpecCpuGhz,
      benchSpecRamGb,
      benchSpecDiskIops,
      benchSpecNetworkMbps,
      benchSpecLatencyMs
    ].forEach(input => {
      input.oninput = () => {
        benchServerPresetSelect.value = "custom";
      };
    });

    applyBenchServerSpecsBtn.onclick = () => {
      applyBenchmarkServerSpecs(true);
      fitCanvas();
    };

    populateSpecForm(SERVERS[0], benchmarkSpecControls);
  }

  // Finish benchmark and auto-export CSV
  function finishBenchmark() {
    isRunning = false;

    const today = new Date().toISOString().slice(0, 10);
    const algo = getAlgorithmExportLabel();
    const filename = `benchmark_${benchmarkTargetTasks}_tasks_${algo}_${today}.csv`;

    const csv = generateBenchmarkCSV();
    downloadCSV(csv, filename);

    const avgWait = (totalWaitMs / completedTasks / 1000).toFixed(2);
    benchmarkResultsEl.innerHTML = `
      <strong style="color:#3fb950">Benchmark completed!</strong><br>
      Tasks: ${completedTasks}<br>
      Request Rate: ${formatRequestRate(REQUEST_RATE_PER_MIN)}<br>
      Base Service: ${formatServiceTime(BASE_SERVICE_TIME_MS)}<br>
      Avg Wait: ${avgWait} s<br>
      File generated: ${filename}
    `;

    log(`Benchmark finished – CSV generated: ${filename}`, "#3fb950");
    // Re-enable sidebar sliders after benchmark completes
    setBenchmarkLocked(false);
    setBenchmarkSidebar(false);
    syncAlgorithmControls();
  }

  // Generate CSV content
  function generateBenchmarkCSV() {
    let csv = "TaskID,Algorithm,WorkloadMix,RequestRate_per_min,BaseServiceTime_ms,ArrivalFrame,WaitTime_ms,TaskType,Server,ServerModel\n";
    benchmarkTaskData.forEach((t, i) => {
      csv += `${i+1},${getAlgorithmExportLabel()},${t.workloadMix},${t.requestRate},${t.baseServiceTime},${t.arrival},${t.wait},${t.taskType},${t.server},${t.serverModel}\n`;
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
  spawnRange.value = REQUEST_RATE_PER_MIN;
  procRange.value = BASE_SERVICE_TIME_MS;
  if (benchSpawnRange) benchSpawnRange.value = REQUEST_RATE_PER_MIN;
  if (benchProcRange) benchProcRange.value = BASE_SERVICE_TIME_MS;
  updateWorkloadControlLabels();
  fitCanvas();
  animationLoop();
  modeOverlay.style.display = "flex";
});
