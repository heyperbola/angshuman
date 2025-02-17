document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const phaseOptions = document.querySelectorAll('.phase-option');
    const nextButton = document.getElementById('nextButton');
    const closeButton = document.getElementById('closeButton');

    startButton.addEventListener('click', () => {
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('phaseSelectionPage').style.display = 'flex';
    });

    phaseOptions.forEach(option => {
        option.addEventListener('click', () => {
            const phaseCount = parseInt(option.getAttribute('data-phase'));
            createPhaseInputs(phaseCount);
            document.getElementById('phaseSelectionPage').style.display = 'none';
            document.getElementById('calculatorPage').style.display = 'block';
        });
    });

    nextButton.addEventListener('click', () => {
        currentChartIndex = (currentChartIndex + 1) % charts.length;
        showChart(currentChartIndex);
    });

    closeButton.addEventListener('click', () => {
        document.getElementById('graphView').style.display = 'none';
        document.getElementById('calculatorPage').style.display = 'block';
        document.getElementById('graphContainer').innerHTML = '';
    });
});

let charts = [];
let currentChartIndex = 0;

function createPhaseInputs(phaseCount) {
    const container = document.getElementById('phaseInputs');
    container.innerHTML = '';

    for (let i = 1; i <= phaseCount; i++) {
        const div = document.createElement('div');
        div.className = 'phase-input';
        div.innerHTML = `
            <h4>Phase ${i}</h4>
            <label>Resistance (R) Ω: </label>
            <input type="number" id="r${i}" value="${10 + i}" step="any">
            <label>Inductance (L) H: </label>
            <input type="number" id="l${i}" value="${0.01 * i}" step="any">
            <label>Capacitance (C) F: </label>
            <input type="number" id="c${i}" value="${0.0001 * i}" step="any">
            <label>Power Factor (cos φ): </label>
            <input type="number" id="pf${i}" value="0.9" step="0.01" min="0" max="1">
        `;
        container.appendChild(div);
    }
}

function calculatePower() {
    const phaseCount = document.querySelectorAll('.phase-input').length;
    charts = [];

    // Generate Voltage vs Time Graph
    const voltage = parseFloat(document.getElementById('voltage').value);
    const minFreq = parseFloat(document.getElementById('minFreq').value);
    const maxFreq = parseFloat(document.getElementById('maxFreq').value);

    // Generate time values for one cycle
    const frequency = minFreq; // Use min frequency for time calculation
    const timeStep = 0.001; // Time step for smooth waveform
    const timeValues = [];
    const voltageValues = [];

    for (let t = 0; t <= 1 / frequency; t += timeStep) {
        timeValues.push(t);
        voltageValues.push(voltage * Math.sin(2 * Math.PI * frequency * t));
    }

    // Create Voltage vs Time Chart
    charts.push({
        title: 'Voltage vs Time',
        labels: timeValues,
        data: voltageValues,
        color: '#4CAF50',
        yLabel: 'Voltage (V)'
    });

    // Generate Power Graphs for Each Phase
    for (let i = 1; i <= phaseCount; i++) {
        const R = parseFloat(document.getElementById(`r${i}`).value);
        const L = parseFloat(document.getElementById(`l${i}`).value);
        const C = parseFloat(document.getElementById(`c${i}`).value);
        const pf = parseFloat(document.getElementById(`pf${i}`).value);

        const frequencies = [50, 60, 70, 80, 90, 100];
        const realPower = [];
        const reactivePower = [];
        const apparentPower = [];

        frequencies.forEach(freq => {
            const omega = 2 * Math.PI * freq;
            const X_L = omega * L;
            const X_C = 1 / (omega * C);
            const X = X_L - X_C;
            const Z = Math.sqrt(R ** 2 + X ** 2);
            const V = 230; // Example voltage
            const I = V / Z;
            const S = V * I; // Apparent Power
            const P = S * pf; // Real Power
            const Q = Math.sqrt(S ** 2 - P ** 2); // Reactive Power

            realPower.push(P);
            reactivePower.push(Q);
            apparentPower.push(S);
        });

        charts.push({
            title: `Phase ${i} Real Power`,
            labels: frequencies,
            data: realPower,
            color: '#4CAF50',
            yLabel: 'Power (W)'
        });
        charts.push({
            title: `Phase ${i} Reactive Power`,
            labels: frequencies,
            data: reactivePower,
            color: '#ff6384',
            yLabel: 'Power (VAR)'
        });
        charts.push({
            title: `Phase ${i} Apparent Power`,
            labels: frequencies,
            data: apparentPower,
            color: '#36a2eb',
            yLabel: 'Power (VA)'
        });
    }

    // Show Graph View
    document.getElementById('calculatorPage').style.display = 'none';
    document.getElementById('graphView').style.display = 'flex';
    showChart(0);
}

function showChart(index) {
    const container = document.getElementById('graphContainer');
    container.innerHTML = '';
    const chartData = charts[index];

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: chartData.title,
                data: chartData.data,
                borderColor: chartData.color,
                borderWidth: 1, // Reduced thickness
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: chartData.yLabel
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: chartData.title.includes('Time') ? 'Time (s)' : 'Frequency (Hz)'
                    }
                }
            }
        }
    });
}