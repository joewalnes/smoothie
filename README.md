![npm version](https://img.shields.io/npm/v/smoothie.svg)

*Smoothie Charts* is a really small charting library designed for _live
streaming data_. I built it to reduce the headaches I was getting from
watching charts jerkily updating every second.

See [http://smoothiecharts.org](http://smoothiecharts.org)

---

### Getting Started

*   [Hello world example](http://smoothiecharts.org/examples/example1.html)
*   [Another example (server CPU usage)](http://smoothiecharts.org/examples/server-load.html)
*   [Another example (responsive layout)](http://smoothiecharts.org/examples/responsive.html)
*   [Tutorial](http://smoothiecharts.org/tutorial.html)
*   [Interactive builder](http://smoothiecharts.org/builder/)
*   Just the JavaScript: [smoothie.js](http://github.com/joewalnes/smoothie/raw/master/smoothie.js)
*   Full distribution (docs and examples): [zip](http://github.com/joewalnes/smoothie/zipball/master) or [tgz](http://github.com/joewalnes/smoothie/tarball/master)
*   Repository: `git clone git@github.com:joewalnes/smoothie.git`
*   Bower: `bower install smoothie`
*   NPM: `npm install smoothie`
*   Yarn: `yarn install smoothie`
*   [Introducing Smoothie Charts](http://joewalnes.com/2010/08/10/introducing-smoothie-charts/) (blog entry)

---

### Example

Given a `<canvas>`:

```html
<canvas id="chart" width="400" height="100"></canvas>
```

Create a time series and chart with code resembling:

```js
// Create a time series
var series = new TimeSeries();

// Find the canvas
var canvas = document.getElementById('chart');

// Create the chart
var chart = new SmoothieChart();
chart.addTimeSeries(series, { strokeStyle: 'rgba(0, 255, 0, 1)' });
chart.streamTo(canvas, 500);
```

Then, add data to your time series and it will be displayed on the chart:

```js
// Randomly add a data point every 500ms
setInterval(function() {
    series.append(Date.now(), Math.random() * 10000);
}, 500);
```

---

### Questions

For help, use the [Smoothie Charts Google Group](http://groups.google.com/group/smoothie-charts).

---

[License](http://smoothiecharts.org/LICENSE.txt) (MIT)

- [Joe Walnes](https://joewalnes.com/)
- [Drew Noakes](https://drewnoakes.com/)

