import { round } from './mathUtil';

export default class Point {
  constructor(par1, par2, isPloar = false) {
    if (!isPloar) {
      this.x = par1;
      this.y = par2;

      this.radian = Math.atan2(this.y, this.x);
      this.matrix = (this.x ** 2 + this.y ** 2) ** 0.5;
      this.isOrigin = this.x === 0 && this.y === 0;
    } else {
      this.matrix = par1;
      this.radian = par2;

      this.x = this.matrix * Math.cos(this.radian);
      this.y = this.matrix * Math.sin(this.radian);
      this.isOrigin = this.matrix === 0;
    }
  }

  equal(point) {
    return this.x === point.x && this.y === point.y;
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }

  // 将该点缩放到另一点
  scale(n, decimals = 4) {
    return new Point(round(n * this.x, decimals), round(n * this.y, decimals));
  }

  // 将该点旋转到另一点
  rotate(theta, decimals = 4) {
    return new Point(
      round(this.matrix * Math.acos(this.radian + theta), decimals),
      round(this.matrix * Math.asin(this.radian + theta), decimals)
    );
  }

  // 将该点增量变化到另一点
  translate(iX, iY, decimals = 4) {
    return new Point(round(this.x + iX, decimals), map(this.y + iY, decimals));
  }

  // svg中移动到某点，返回绘制路径
  static moveTo(point) {
    return `M ${point.x} ${point.y}`;
  }

  // svg中绘制直线到某点，返回绘制路径
  static lineTo(point) {
    return `L ${point.x} ${point.y}`;
  }

  // svg中绘制圆弧到某点，返回绘制路径
  static arcTo(point, isClockwise = 0, isLargeArc = 0, radius = point.matrix) {
    return `
    A 
      ${radius} 
      ${radius} 
      0 
      ${isLargeArc} 
      ${isClockwise} 
      ${point.x} 
      ${point.y}
    `;
  }
}
