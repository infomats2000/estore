import { PCBuildSelection, CompatibilityWarning, PCBuildMetrics, Product } from '../types';

// Extract spec helper with fallback matching
function getSpec(product: Product | undefined, key: string): string {
  if (!product || !product.specs) return '';
  const matchKey = Object.keys(product.specs).find(k => k.toLowerCase().includes(key.toLowerCase()));
  if (matchKey) return product.specs[matchKey];

  // Infer from product name/description
  const text = `${product.name} ${product.description || ''}`.toUpperCase();
  if (key === 'socket') {
    if (text.includes('LGA1700') || text.includes('1700') || text.includes('13TH') || text.includes('14TH')) return 'LGA1700';
    if (text.includes('AM5') || text.includes('7000') || text.includes('9000')) return 'AM5';
    if (text.includes('AM4') || text.includes('5000') || text.includes('3000')) return 'AM4';
  }
  if (key === 'ramType') {
    if (text.includes('DDR5')) return 'DDR5';
    if (text.includes('DDR4')) return 'DDR4';
  }
  return '';
}

function parseNum(product: Product | undefined, key: string, fallback: number): number {
  const val = getSpec(product, key);
  const matched = val.match(/\d+/);
  return matched ? parseInt(matched[0], 10) : fallback;
}

export function verifyPCBuildCompatibility(selection: PCBuildSelection): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];
  const { cpu, motherboard, ram, gpu, psu, ssd, case: pcCase, cooler } = selection;

  // 1. Socket Compatibility
  if (cpu && motherboard) {
    const cpuSocket = getSpec(cpu, 'socket');
    const mbSocket = getSpec(motherboard, 'socket');
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      warnings.push({
        id: 'ERR-SOCKET',
        type: 'error',
        title: 'CPU Socket Incompatibility',
        message: `CPU (${cpu.name}) uses socket ${cpuSocket}, but Motherboard (${motherboard.name}) supports socket ${mbSocket}. They cannot be physically installed together.`
      });
    }
  }

  // 2. RAM Generation Compatibility
  if (ram && motherboard) {
    const ramType = getSpec(ram, 'ramType');
    const mbRamType = getSpec(motherboard, 'ramType');
    if (ramType && mbRamType && ramType !== mbRamType) {
      warnings.push({
        id: 'ERR-RAM',
        type: 'error',
        title: 'RAM Generation Mismatch',
        message: `RAM kit (${ram.name}) is ${ramType}, but Motherboard (${motherboard.name}) strictly requires ${mbRamType} memory slots.`
      });
    }
  }

  // 3. PSU Wattage Verification
  const cpuTdp = parseNum(cpu, 'tdp', 125);
  const gpuTdp = parseNum(gpu, 'tdp', 250);
  const systemBaseTdp = 75; // Motherboard + RAM + Fans + Storage
  const totalEstimatedTdp = (cpu ? cpuTdp : 0) + (gpu ? gpuTdp : 0) + systemBaseTdp;
  const psuWattage = parseNum(psu, 'wattage', 650);

  if (psu) {
    if (psuWattage < totalEstimatedTdp) {
      warnings.push({
        id: 'ERR-PSU-LOW',
        type: 'error',
        title: 'Insufficient PSU Power',
        message: `System estimated TDP power draw (${totalEstimatedTdp}W) exceeds PSU capacity (${psuWattage}W). Under heavy load, the rig will shut down.`
      });
    } else if (psuWattage < totalEstimatedTdp + 100) {
      warnings.push({
        id: 'WARN-PSU-HEADROOM',
        type: 'warning',
        title: 'Tight Power Overhead',
        message: `PSU (${psuWattage}W) provides less than 100W headroom over system TDP (${totalEstimatedTdp}W). A ${totalEstimatedTdp + 150}W PSU is recommended for transient spikes.`
      });
    }
  }

  // 4. GPU Length Clearance
  if (gpu && pcCase) {
    const gpuLength = parseNum(gpu, 'length', 300);
    const maxGpuClearance = parseNum(pcCase, 'maxGpuLength', 340);
    if (gpuLength > maxGpuClearance) {
      warnings.push({
        id: 'ERR-GPU-SIZE',
        type: 'error',
        title: 'GPU Clearance Issue',
        message: `GPU card length (${gpuLength}mm) exceeds Case maximum GPU clearance (${maxGpuClearance}mm). The GPU will not fit inside the chassis.`
      });
    }
  }

  // 5. Cooler Height Clearance
  if (cooler && pcCase) {
    const coolerHeight = parseNum(cooler, 'height', 155);
    const maxCoolerHeight = parseNum(pcCase, 'maxCoolerHeight', 160);
    if (coolerHeight > maxCoolerHeight) {
      warnings.push({
        id: 'ERR-COOLER-HEIGHT',
        type: 'error',
        title: 'CPU Cooler Height Issue',
        message: `Cooler height (${coolerHeight}mm) exceeds Case side panel clearance (${maxCoolerHeight}mm). Side panel cannot be closed.`
      });
    }
  }

  // 6. BIOS Version Compatibility
  if (cpu && motherboard) {
    const cpuName = cpu.name.toUpperCase();
    const mbName = motherboard.name.toUpperCase();
    if (cpuName.includes('14TH') && (mbName.includes('Z690') || mbName.includes('B660'))) {
      warnings.push({
        id: 'INFO-BIOS',
        type: 'info',
        title: 'BIOS Update May Be Required',
        message: `14th Gen Intel CPU on 600-series Motherboard may require a motherboard BIOS flash before initial post.`
      });
    }
  }

  return warnings;
}

export function calculatePCBuildMetrics(selection: PCBuildSelection): PCBuildMetrics {
  const { cpu, motherboard, ram, gpu, psu, ssd, case: pcCase, cooler } = selection;

  const totalCost = [cpu, motherboard, ram, gpu, psu, ssd, pcCase, cooler]
    .filter(Boolean)
    .reduce((sum, item) => sum + (item?.discountPrice || item?.price || 0), 0);

  const cpuTdp = parseNum(cpu, 'tdp', 125);
  const gpuTdp = parseNum(gpu, 'tdp', 250);
  const estimatedWattage = (cpu ? cpuTdp : 0) + (gpu ? gpuTdp : 0) + 75;
  const recommendedWattage = Math.ceil((estimatedWattage + 150) / 50) * 50;
  const psuWattage = parseNum(psu, 'wattage', 650);

  // Performance rating (1 - 100)
  const gpuPrice = gpu?.price || 0;
  const cpuPrice = cpu?.price || 0;
  const performanceScore = Math.min(99, Math.max(25, Math.floor((gpuPrice * 0.04) + (cpuPrice * 0.03) + 35)));

  // Bottleneck Rating
  let bottleneckRating = 'Optimal Hardware Balance';
  if (gpuPrice > 1200 && cpuPrice < 250) {
    bottleneckRating = 'Minor CPU Bottleneck (15%)';
  } else if (cpuPrice > 600 && gpuPrice < 350) {
    bottleneckRating = 'GPU Bottleneck (22%)';
  }

  // FPS Estimates
  const fpsMultiplier = performanceScore / 60;
  const fpsEstimates = [
    { game: 'Cyberpunk 2077 (Ultra RT)', fps1080p: Math.floor(95 * fpsMultiplier), fps1440p: Math.floor(72 * fpsMultiplier), fps4k: Math.floor(45 * fpsMultiplier) },
    { game: 'Call of Duty: Warzone', fps1080p: Math.floor(180 * fpsMultiplier), fps1440p: Math.floor(135 * fpsMultiplier), fps4k: Math.floor(88 * fpsMultiplier) },
    { game: 'Valorant / CS2 (Competitive)', fps1080p: Math.floor(450 * fpsMultiplier), fps1440p: Math.floor(380 * fpsMultiplier), fps4k: Math.floor(290 * fpsMultiplier) },
    { game: 'Apex Legends', fps1080p: Math.floor(210 * fpsMultiplier), fps1440p: Math.floor(165 * fpsMultiplier), fps4k: Math.floor(110 * fpsMultiplier) }
  ];

  // AI Recommendations
  const aiRecommendations: string[] = [];
  if (!psu || psuWattage < recommendedWattage) {
    aiRecommendations.push(`Recommend pairing this build with a ${recommendedWattage}W 80+ Gold PSU for optimal energy efficiency and spike protection.`);
  }
  if (gpuPrice > 800 && (!ram || parseNum(ram, 'size', 16) < 32)) {
    aiRecommendations.push('Upgrade to a 32GB (2x16GB) DDR5 Dual-Channel Memory Kit to eliminate stutter in 4K AAA titles.');
  }
  if (!cooler && cpuTdp >= 125) {
    aiRecommendations.push('High-TDP Processor detected. Adding a 240mm/360mm AIO Liquid Cooler is strongly advised for thermal management.');
  }
  if (aiRecommendations.length === 0) {
    aiRecommendations.push('Exceptional build configuration! Component selection offers maximum performance-per-dollar efficiency.');
  }

  return {
    totalCost,
    estimatedWattage,
    recommendedWattage,
    psuSufficient: psu ? psuWattage >= estimatedWattage : true,
    performanceScore,
    bottleneckRating,
    fpsEstimates,
    aiRecommendations
  };
}
