import React, { useState } from 'react';
import { Input, Slider, Radio } from 'antd';
import sha256 from 'crypto-js/sha256';
import Point from '../utils/Point';
import { range, mapTo } from '../utils/mathUtil';

// 最外层圆的半径
const R = 100;
// 圆被分割的层数
const count = 4;

// 等面积数组
const areaArr = range(count).map(item => (count - item) ** 0.5 / count ** 0.5);
// 等半径数组
const radiusArr = range(count).map(item => (count - item) / count);

// 用于计算四层圆的各层半径
function getRadius(index, mix) {
  const ratio = mix * areaArr[index] + (1 - mix) * radiusArr[index];
  return R * ratio;
}

// 每个小块的svg绘制路径
function drawBlock(
  iRingStart,
  iRingEnd,
  oRingStart,
  oRingEnd,
  oRingSetting,
  iRingSetting
) {
  const isOrigin = iRingStart.equal(iRingEnd);

  return [
    Point.moveTo(iRingStart),
    !isOrigin
      ? Point.arcTo(
          iRingEnd,
          iRingSetting.direction,
          iRingSetting.large,
          iRingEnd.matrix * iRingSetting.radius
        )
      : '',
    Point.lineTo(oRingEnd),
    Point.arcTo(
      oRingStart,
      oRingSetting.direction,
      oRingSetting.large,
      oRingEnd.matrix * oRingSetting.radius
    ),
    'Z'
  ].join(' ');
}

// 获取每个小块的绘制路径
function getBlocksPath(radius, disorder, oRingSetting, iRingSetting) {
  const blockInfo = radius.map((outterRadius, i) => {
    const innerRadius = i + 1 >= radius.length ? 0 : radius[i + 1];
    const arcCache = range(8).map(j => {
      const theta = (Math.PI * (j + i * disorder * 4)) / 4;
      return new Point(1, theta, true);
    });

    return arcCache.map((item, index) => {
      const nextIndex = index + 1 >= arcCache.length ? 0 : index + 1;
      const next = arcCache[nextIndex];

      const iRingStart = item.scale(innerRadius);
      const iRingEnd = next.scale(innerRadius);
      const oRingStart = item.scale(outterRadius);
      const oRingEnd = next.scale(outterRadius);
      return drawBlock(
        iRingStart,
        iRingEnd,
        oRingStart,
        oRingEnd,
        oRingSetting,
        iRingSetting
      );
    });
  });

  return blockInfo.flat();
}

// 获取各个小块的hsl值
function getHsl(hash) {
  // 1.分割hash，获取各层和各模块的值
  const hashSplice = len => {
    let temp = hash;
    const spliceLength = temp.length / len;
    return range(len).map(item =>
      temp.slice(item * spliceLength, (item + 1) * spliceLength)
    );
  };
  const rings = hashSplice(4);
  const blocks = hashSplice(32);

  // 2.计算hash、ring、block的特征
  const blocksNum = blocks.map(item => parseInt(item, 16));
  const oxReducer = (acc, cur) => cur ^ acc;

  const hashFeature = mapTo(
    blocksNum.reduce(oxReducer, 0),
    [0, 100],
    [0, 0xff]
  );
  const ringsFeature = rings.map((_, i) => {
    const temp = blocksNum.slice(i * 8, (i + 1) * 8);
    return mapTo(temp.reduce(oxReducer, 0), [0, 250], [0, 0xff]);
  });
  const blocksFeature = blocksNum.map(item => mapTo(item, [0, 10], [0, 0xff]));

  // 3.通过特征数据计算出各个块hsl的值
  return blocksFeature.map((item, index) => {
    const ringIndex = Math.floor(index / 8);
    const hue = Math.floor(hashFeature + ringsFeature[ringIndex] + item);
    const saturation = mapTo(blocksNum[index], [40, 60], [0, 0xff]);
    const lightness = mapTo(blocksNum[index], [30, 70], [0, 0xff]);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
}

// 封装拆分的各个圆弧的相关数据
function wrapArcData(radius, hash, disorder, oRingSetting, iRingSetting) {
  const hsl = getHsl(hash);
  const blocks = getBlocksPath(radius, disorder, oRingSetting, iRingSetting);

  return blocks.map((item, index) => ({
    path: item,
    fill: hsl[index]
  }));
}

const iRange = [Math.sin(Math.PI / 8), 2];
const mRange = [0, 100];

export default function Circle() {
  // 协同使用等面积与等半径情况下的半径的混合因子
  const [mix, setMix] = useState(0.42);
  const [disorder, setDisorder] = useState(0);
  const [user, setUser] = useState('Fountain Shaw');
  const [oRingSetting, setORingSetting] = useState({
    radius: 1, // 圆环半径的倍数，取值为(sin(PI/8), 1], [1, infinity)
    direction: 0, // 圆环绘制方向，取值0或1
    large: 0 // 圆环弧段大小，取值0或1
  });
  const [iRingSetting, setIRingSetting] = useState({
    radius: 1, // 圆环半径的倍数，取值为(0.3826, infinity)
    direction: 0, // 圆环绘制方向，取值0或1
    large: 0 // 圆环弧段大小，取值0或1
  });

  const oRingRatio = mapTo(oRingSetting.radius, mRange, iRange);
  const iRingRatio = mapTo(iRingSetting.radius, mRange, iRange);

  const radius = areaArr.map((_, index) => getRadius(index, mix));
  const hash = sha256(user).toString();
  const blockInfo = wrapArcData(
    radius,
    hash,
    disorder,
    oRingSetting,
    iRingSetting
  );

  return (
    <div style={{ padding: '0 50px' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '50px' }}>
        <span>用户名：</span>
        <Input
          style={{ flex: 4 }}
          value={user}
          onChange={e => setUser(e.target.value)}
        />
      </div>
      <Slider
        style={{ height: '20px' }}
        value={mix * 100}
        tooltipVisible={false}
        marks={{ [mix * 100]: `尺寸因子：${Math.floor(mix * 100)}%` }}
        onChange={val => setMix(val / 100)}
      />
      <Slider
        style={{ height: '20px' }}
        value={disorder * 100}
        tooltipVisible={false}
        marks={{ [disorder * 100]: `旋转因子：${Math.floor(disorder * 100)}%` }}
        onChange={val => setDisorder(val / 100)}
      />
      <Slider
        style={{ height: '20px' }}
        value={oRingRatio}
        tooltipVisible={false}
        marks={{
          [oRingRatio]: `外环半径比例：${Math.floor(oRingRatio)}%`
        }}
        onChange={val =>
          setORingSetting(
            Object.assign({}, oRingSetting, {
              radius: mapTo(val, iRange, mRange)
            })
          )
        }
      />
      <Slider
        style={{ height: '20px' }}
        value={iRingRatio}
        tooltipVisible={false}
        marks={{
          [iRingRatio]: `内环半径比例${Math.floor(iRingRatio)}%`
        }}
        onChange={val =>
          setIRingSetting(
            Object.assign({}, iRingSetting, {
              radius: mapTo(val, iRange, mRange)
            })
          )
        }
      />
      <div style={{ display: 'flex', height: '50px' }}>
        <div style={{ flex: 1 }}>
          <span>外环绘制方向：</span>
          <Radio.Group
            name={'oRing'}
            value={oRingSetting.direction}
            onChange={e =>
              setORingSetting(
                Object.assign({}, oRingSetting, { direction: e.target.value })
              )
            }
          >
            <Radio value={0}>顺时针</Radio>
            <Radio value={1}>逆时针</Radio>
          </Radio.Group>
        </div>
        <div style={{ flex: 1 }}>
          <span>内环绘制方向：</span>
          <Radio.Group
            name={'iRing'}
            value={iRingSetting.direction}
            onChange={e =>
              setIRingSetting(
                Object.assign({}, iRingSetting, { direction: e.target.value })
              )
            }
          >
            <Radio value={0}>顺时针</Radio>
            <Radio value={1}>逆时针</Radio>
          </Radio.Group>
        </div>
      </div>
      <div style={{ display: 'flex', height: '50px' }}>
        <div style={{ flex: 1 }}>
          <span>外环弧段：</span>
          <Radio.Group
            name={'oRingL'}
            value={oRingSetting.large}
            onChange={e =>
              setORingSetting(
                Object.assign({}, oRingSetting, { large: e.target.value })
              )
            }
          >
            <Radio value={0}>小弧段</Radio>
            <Radio value={1}>大弧段</Radio>
          </Radio.Group>
        </div>
        <div style={{ flex: 1 }}>
          <span>内环弧段：</span>
          <Radio.Group
            name={'iRingL'}
            value={iRingSetting.large}
            onChange={e =>
              setIRingSetting(
                Object.assign({}, iRingSetting, { large: e.target.value })
              )
            }
          >
            <Radio value={0}>小弧段</Radio>
            <Radio value={1}>大弧段</Radio>
          </Radio.Group>
        </div>
      </div>
      <svg viewBox={`${-1.5 * R} ${-1.5 * R} ${3 * R} ${3 * R}`}>
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
