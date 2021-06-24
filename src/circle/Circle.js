import React, { useState } from 'react';
import { Slider } from 'antd';

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

// 缓存各层圆弧的角度数据
let arcCache;

// 封装拆分的各个圆弧的相关数据
function wrapArcData(radius) {
  const range = [...Array(8).keys()];

  if (!arcCache) {
    arcCache = range.map(item => ({
      x: Math.cos((Math.PI * item) / 4),
      y: Math.sin((Math.PI * item) / 4)
    }));
  }

  const ringPoints = radius.map(r => {
    return arcCache.map(item => ({
      x: round(r * item.x, 4),
      y: round(r * item.y, 4),
      r
    }));
  });

  let index = ringPoints.length;
  // while (index > 0) {}
  const obj = {
    path: `M0 0 L-100 0 A100 100 0 0 1 ${-100 * Math.SQRT1_2} ${-100 *
      Math.SQRT1_2} Z`,
    fill: '#ccc'
  };
}

export default function Circle() {
  // 协同使用等面积与等半径情况下的半径的混合因子
  const [mix, setMix] = useState(0.42);
  const radius = areaArr.map((_, index) => getRadius(index, mix));
  const ringPoints = wrapArcData(radius);
  console.log(ringPoints);

  return (
    <div style={{ padding: '30px' }}>
      <Slider
        value={mix * 100}
        tooltipVisible={false}
        marks={{ [mix * 100]: `混合因子：${Math.floor(mix * 100)}%` }}
        onChange={val => setMix(val / 100)}
      />
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}>
        {radius.map(r => (
          <circle
            key={r}
            cx={0}
            cy={0}
            r={r}
            fill={`hsl(${(r * 256) / 100}, ${60}%, ${60}%)`}
          />
        ))}
        <line
          x1={-R}
          x2={R}
          y1={0}
          y2={0}
          stroke={'#fff'}
          strokeWidth={'0.1'}
        />
        <line
          y1={-R}
          y2={R}
          x1={0}
          x2={0}
          stroke={'#fff'}
          strokeWidth={'0.1'}
        />
        <line
          x1={-R * Math.SQRT1_2}
          x2={R * Math.SQRT1_2}
          y1={-R * Math.SQRT1_2}
          y2={R * Math.SQRT1_2}
          stroke={'#fff'}
          strokeWidth={'0.1'}
        />
        <line
          x1={R * Math.SQRT1_2}
          x2={-R * Math.SQRT1_2}
          y1={-R * Math.SQRT1_2}
          y2={R * Math.SQRT1_2}
          stroke={'#fff'}
          strokeWidth={'0.1'}
        />
      </svg>
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}>
        <path
          d={`M0 0 L-100 0 A100 100 0 0 1 ${-100 * Math.SQRT1_2} ${-100 *
            Math.SQRT1_2} Z`}
          stroke={'white'}
          strokeWidth={'0.5'}
          fill={'lime'}
        />
      </svg>
    </div>
  );
}
