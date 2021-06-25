import React, { useState, useEffect } from 'react';
import { Input, Slider, Button } from 'antd';
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

// 获取各个小块的hsl值
function getHsl(hash) {
  // 1.分割hash，获取各层和各模块的值
  const hashSplice = len => {
    let temp = hash;
    const spliceLength = temp.length / len;
    return [...Array(len).keys()].map(item =>
      temp.slice(item * spliceLength, (item + 1) * spliceLength)
    );
  };
  const rings = hashSplice(4);
  const blocks = hashSplice(32);

  // 2.计算hash、ring、block的特征
  const blocksNum = blocks.map(item => parseInt(item, 16));
  const oxReducer = (acc, cur) => cur ^ acc;

  const hashFeature = (blocksNum.reduce(oxReducer, 0) * 100) / 255;
  const ringsFeature = rings.map((_, i) => {
    const temp = blocksNum.slice(i * 8, (i + 1) * 8);
    return (temp.reduce(oxReducer, 0) * 250) / 255;
  });
  const blocksFeature = blocksNum.map(item => (item * 10) / 255);

  // 3.通过特征数据计算出各个块hsl的值
  return blocksFeature.map((item, index) => {
    const ringIndex = Math.floor(index / 8);
    const hue = Math.floor(hashFeature + ringsFeature[ringIndex] + item);
    const saturation = (blocksNum[index] * 60) / 255 + 40;
    const lightness = (blocksNum[index] * 70) / 255 + 30;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
}

// 封装拆分的各个圆弧的相关数据
function wrapArcData(radius, hash, disorder = 0) {
  const hsl = getHsl(hash);
  const range = [...Array(8).keys()];

  const blockInfo = radius.map((r, i) => {
    const innerRadius = i + 1 >= radius.length ? 0 : radius[i + 1];
    const arcCache = range.map(j => ({
      x: Math.cos((Math.PI * (j + i * disorder)) / 4),
      y: Math.sin((Math.PI * (j + i * disorder)) / 4)
    }));

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
        fill: hsl[i * 8 + index]
      };
    });
  });

  return blockInfo.flat();
}

export default function Circle() {
  // 协同使用等面积与等半径情况下的半径的混合因子
  const [mix, setMix] = useState(0.42);
  const [disorder, setDisorder] = useState(0);
  const [user, setUser] = useState('Fountain Shaw');
  const [blockInfo, setBlockInfo] = useState([]);

  const radius = areaArr.map((_, index) => getRadius(index, mix));
  const generatArcData = () => {
    const hash = sha256(user).toString();
    setBlockInfo(wrapArcData(radius, hash, disorder));
  };

  useEffect(generatArcData, [disorder, mix]);

  return (
    <div style={{ padding: '50px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>用户名：</span>
        <Input
          style={{ flex: 4 }}
          value={user}
          onChange={e => setUser(e.target.value)}
          onPressEnter={generatArcData}
        />
        <Button
          style={{ marginLeft: '10px' }}
          type="primary"
          size={'small'}
          onClick={generatArcData}
        >
          确认
        </Button>
      </div>
      <Slider
        value={mix * 100}
        tooltipVisible={false}
        marks={{ [mix * 100]: `尺寸因子：${Math.floor(mix * 100)}%` }}
        onChange={val => setMix(val / 100)}
      />
      <Slider
        value={disorder * 100}
        tooltipVisible={false}
        marks={{ [disorder * 100]: `旋转因子：${Math.floor(disorder * 100)}%` }}
        onChange={val => setDisorder(val / 100)}
      />
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}>
        {blockInfo.map(item => (
          <path
            key={item.path}
            d={item.path}
            fill={item.fill}
            stroke={'white'}
            strokeWidth={'0.5'}
          />
        ))}
      </svg>
    </div>
  );
}
