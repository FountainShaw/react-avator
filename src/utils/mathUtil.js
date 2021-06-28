// 获取十进制数保留固定精度的小数的值
export function round(n, decimals = 0) {
  let num = `${n}`.toLowerCase();
  if (!num.includes('e')) num = `${n}e${decimals}`;
  return Number(`${Math.round(num)}e-${decimals}`);
}

// 生成序列，step可以为函数
export function range(size, start = 0, step = 1) {
  const tempRange = [...Array(size).keys()];
  if (start === 0 && step === 1) return tempRange;

  let iStep = false;
  if (typeof step === 'function') iStep = true;
  return tempRange.map(i => {
    return start + i * (iStep ? step(i + 1) : step);
  });
}

// 将某一范围内的数，映射到另一范围内
export function mapTo(val, mapRange, initRange = [0, 1]) {
  if (mapRange[0] === mapRange[1] || initRange[0] === initRange[1]) {
    throw '映射范围不能是一个数值，请检查';
  }

  if (val > initRange[1] || val < initRange[0]) {
    throw '初始值不在初始范围内，请检查';
  }

  const mapSize = mapRange[1] - mapRange[0];
  const initSize = initRange[1] - initRange[0];

  return mapRange[1] - (mapSize * (initRange[1] - val)) / initSize;
}
