import React, { useState } from 'react';
import { Slider } from 'antd';
import 'antd/dist/antd.css';
import './style.css';

// 最外层圆的半径
const R = 100;
// 圆被分割的层数
const count = 8;

// 等面积数组
const areaArr = [...Array(count).keys()].map(
  item => (count - item) ** 0.5 / count ** 0.5
);
// 等半径数组
const raduisArr = [...Array(count).keys()].map(item => (count - item) / count);

// 用于计算四层圆的各层半径
function getRaduis(index, mix) {
  const ratio = mix * areaArr[index] + (1 - mix) * raduisArr[index];
  return R * ratio;
}

export default function App() {
  // 协同使用等面积与等半径情况下的半径的混合因子
  const [mix, setMix] = useState(0.42);
  const raduis = areaArr.map((_, index) => getRaduis(index, mix));

  return (
    <div style={{ padding: '30px' }}>
      <Slider
        value={mix * 100}
        tooltipVisible={false}
        marks={{ [mix * 100]: `混合因子：${Math.floor(mix * 100)}%` }}
        onChange={val => setMix(val / 100)}
      />
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}>
        {raduis.map(r => (
          <circle
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
    </div>
  );
}
