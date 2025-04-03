// color-worker.js

function kMeans(pixels, k, maxIterations, attempts) {
    let bestCenters = null;
    let bestLabels = null;
    let bestDistance = Infinity;
    
    // Convert to float32 for calculations
    const floatPixels = new Float32Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
        floatPixels[i] = pixels[i];
    }
    
    for (let attempt = 0; attempt < attempts; attempt++) {
        // Initialize random centers
        const centers = new Array(k);
        const usedIndices = new Set();
        
        for (let i = 0; i < k; i++) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * (pixels.length / 4));
            } while (usedIndices.has(randomIndex));
            usedIndices.add(randomIndex);
            
            const baseIndex = randomIndex * 4;
            centers[i] = [
                pixels[baseIndex],
                pixels[baseIndex + 1],
                pixels[baseIndex + 2]
            ];
        }
        
        let labels = new Int32Array(pixels.length / 4);
        let changed = true;
        let iteration = 0;
        
        while (changed && iteration < maxIterations) {
            changed = false;
            
            // Assign each pixel to the nearest center
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                
                let minDist = Infinity;
                let bestCluster = -1;
                
                for (let j = 0; j < centers.length; j++) {
                    const center = centers[j];
                    const dr = r - center[0];
                    const dg = g - center[1];
                    const db = b - center[2];
                    const dist = dr * dr + dg * dg + db * db;
                    
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = j;
                    }
                }
                
                if (labels[i / 4] !== bestCluster) {
                    labels[i / 4] = bestCluster;
                    changed = true;
                }
            }
            
            // Update centers
            const counts = new Array(k).fill(0);
            const sums = new Array(k).fill().map(() => [0, 0, 0]);
            
            for (let i = 0; i < pixels.length; i += 4) {
                const cluster = labels[i / 4];
                counts[cluster]++;
                sums[cluster][0] += pixels[i];
                sums[cluster][1] += pixels[i + 1];
                sums[cluster][2] += pixels[i + 2];
            }
            
            for (let j = 0; j < k; j++) {
                if (counts[j] > 0) {
                    centers[j][0] = sums[j][0] / counts[j];
                    centers[j][1] = sums[j][1] / counts[j];
                    centers[j][2] = sums[j][2] / counts[j];
                }
            }
            
            iteration++;
        }
        
        // Calculate total distance for this attempt
        let totalDistance = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            const cluster = labels[i / 4];
            const center = centers[cluster];
            const dr = pixels[i] - center[0];
            const dg = pixels[i + 1] - center[1];
            const db = pixels[i + 2] - center[2];
            totalDistance += dr * dr + dg * dg + db * db;
        }
        
        if (totalDistance < bestDistance) {
            bestDistance = totalDistance;
            bestCenters = centers;
            bestLabels = labels;
        }
    }
    
    return { centers: bestCenters, labels: bestLabels };
}

self.onmessage = function(e) {
    const { pixels, k, maxIterations, attempts } = e.data;
    const result = kMeans(pixels, k, maxIterations, attempts);
    self.postMessage(result);
};
