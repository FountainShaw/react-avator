import React, { useState } from 'react';
import { Slider } from 'antd';
import sha256 from 'crypto-js/sha256';

// 最外层圆的半径
const R = 100;
// 圆被分割的层数
const count = 4;

// 等面积数组
const areaArr = [...Array(count).keys()].map(
  item => (count - item) ** 0.5 / count ** 0.5
);
// 等半径数组
const radiusArr = [...Array(count).keys()].map(item => (count - item) / count);

// 用于计算四层圆的各层半径
function getRadius(index, mix) {
  const ratio = mix * areaArr[index] + (1 - mix) * radiusArr[index];
  return R * ratio;
}

// 十进制数精确到指定小数位
function round(n, decimals = 0) {
  let num = `${n}`.toLowerCase();
  if (!num.includes('e')) num = `${n}e${decimals}`;
  return Number(`${Math.round(num)}e-${decimals}`);
}

// 每个小块的svg绘制路径
function drawBlock(block) {
  const {
    innerRingStartX,
    innerRingStartY,
    innerRingEndX,
    innerRingEndY,
    outterRingStartX,
    outterRIngStartY,
    outterRingEndX,
    outterRingEndY,
    innerRadius,
    outterRadius
  } = block;

  const moveTo = (x, y) => `M ${x} ${y}`;
  const lineTo = (x, y) => `L ${x} ${y}`;
  const arcTo = (x, y, r, direction = '1') =>
    `A ${r} ${r} 0 0 ${direction} ${x} ${y}`;

  const isOrigin =
    innerRingStartX === innerRingEndX && innerRingStartY === innerRingEndY;

  return [
    moveTo(innerRingStartX, innerRingStartY),
    !isOrigin ? arcTo(innerRingEndX, innerRingEndY, innerRadius) : '',
    lineTo(outterRingEndX, outterRingEndY),
    arcTo(outterRingStartX, outterRIngStartY, outterRadius, '0'),
    'Z'
  ].join(' ');
}

// 缓存各层圆弧的角度数据
let arcCache;

// 封装拆分的各个圆弧的相关数据
function wrapArcData(radius, hash) {
  console.log(hash);
  const range = [...Array(8).keys()];

  if (!arcCache) {
    arcCache = range.map(item => ({
      x: Math.cos((Math.PI * item) / 4),
      y: Math.sin((Math.PI * item) / 4)
    }));
  }

  const blockInfo = radius.map((r, i) => {
    const innerRadius = i + 1 >= radius.length ? 0 : radius[i + 1];
    return arcCache.map((item, index) => {
      const nextIndex = index + 1 >= arcCache.length ? 0 : index + 1;
      const outterNext = arcCache[nextIndex];
      const block = {
        innerRingStartX: round(innerRadius * item.x, 4),
        innerRingStartY: round(innerRadius * item.y, 4),
        innerRingEndX: round(innerRadius * outterNext.x, 4),
        innerRingEndY: round(innerRadius * outterNext.y, 4),
        outterRingStartX: round(r * item.x, 4),
        outterRIngStartY: round(r * item.y, 4),
        outterRingEndX: round(r * outterNext.x, 4),
        outterRingEndY: round(r * outterNext.y, 4),
        innerRadius,
        outterRadius: r
      };
      return {
        path: drawBlock(block),
        fill: `hsl(${Math.floor(
          (((block.outterRIngStartY + block.outterRingEndY) / 2 + 100) * 360) /
            200
        )}, ${60}%, ${60}%)`
      };
    });
  });

  return blockInfo.flat();
}

export default function Circle() {
  // 协同使用等面积与等半径情况下的半径的混合因子
  const [mix, setMix] = useState(0.42);
  const radius = areaArr.map((_, index) => getRadius(index, mix));
  const hash = sha256('Message').toString();
  const blockInfo = wrapArcData(radius, hash);

  return (
    <div style={{ padding: '30px' }}>
      <Slider
        value={mix * 100}
        tooltipVisible={false}
        marks={{ [mix * 100]: `混合因子：${Math.floor(mix * 100)}%` }}
        onChange={val => setMix(val / 100)}
      />
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}>
        {blockInfo.map(item => (
          <path
            key={item.path}
            d={item.path}
            fill={item.fill}
            stroke={'white'}
            strokeWidth={'1'}
          />
        ))}
      </svg>
    </div>
  );
}
